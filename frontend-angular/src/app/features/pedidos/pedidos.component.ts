import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbDialogService,
  NbIconModule,
  NbInputModule,
  NbOptionModule,
  NbSelectModule,
  NbSpinnerModule
} from '@nebular/theme';
import { forkJoin, Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Cliente, EntregaCompleta, EstadoPedido, FlujoCompleto, Pedido, Vehiculo } from '../../core/models';
import {
  ConfirmDialogComponent,
  ConfirmDialogStatus
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { PedidoFormDialogComponent } from './pedido-form-dialog.component';
import { EntregaFormDialogComponent } from './entrega-form-dialog.component';
import { InspeccionFormDialogComponent } from '../inspeccion-ia/inspeccion-form-dialog.component';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    NbCardModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule
  ],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss'
})
export class PedidosComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(NbDialogService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  readonly items = signal<Pedido[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly filterEstado = signal<string>('TODOS');
  readonly selected = signal<Pedido | null>(null);
  readonly imagenFallida = signal<Set<number>>(new Set());
  readonly flujoResultado = signal<FlujoCompleto | null>(null);
  readonly flujoEjecutando = signal(false);
  readonly entregaResultado = signal<EntregaCompleta | null>(null);

  readonly canManage = () => this.auth.hasRole('ADMIN', 'VENDEDOR');
  readonly isCliente = () => this.auth.hasRole('CLIENTE');
  readonly actorUsername = computed(() => this.auth.currentUser()?.username ?? null);
  readonly pageTitle = computed(() =>
    this.isCliente() ? 'Mis Pedidos' : 'Gestión de Ventas'
  );
  readonly pageSubtitle = computed(() =>
    this.isCliente()
      ? 'Seguimiento de tus compras e importaciones'
      : 'Pedidos y facturación del sistema'
  );

  readonly stats = computed(() => {
    const all = this.items();
    return {
      pendientes: all.filter((p) => p.estado === 'PENDIENTE').length,
      enProceso: all.filter((p) => p.estado === 'CONFIRMADO' || p.estado === 'EN_IMPORTACION').length,
      completados: all.filter((p) => p.estado === 'ENTREGADO').length,
      cancelados: all.filter((p) => p.estado === 'CANCELADO').length
    };
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const est = this.filterEstado();
    return this.items().filter((p) => {
      if (est !== 'TODOS' && p.estado !== est) return false;
      if (!q) return true;
      const hay = [p.codigo, p.clienteNombre, p.vehiculoTitulo, p.vehiculoVin, p.estado]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    if (this.canManage()) {
      forkJoin({
        pedidos: this.api.getPedidos(),
        clientes: this.api.getClientes(),
        vehiculos: this.api.getVehiculos()
      }).subscribe({
        next: ({ pedidos, clientes, vehiculos }) => {
          this.items.set(pedidos);
          this.clientes.set(clientes.filter((c) => c.activo));
          this.vehiculos.set(vehiculos.filter((v) => v.estado === 'DISPONIBLE'));
          this.loading.set(false);
          this.syncSelected(pedidos);
          this.aplicarFocoDesdeRuta();
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.detail ?? 'No se pudo cargar pedidos');
        }
      });
      return;
    }

    const clienteId = this.auth.clienteId();
    if (!clienteId) {
      this.loading.set(false);
      this.error.set('Tu cuenta no está vinculada a un cliente. Contacta al administrador.');
      return;
    }

    forkJoin({
      pedidos: this.api.getPedidosPorCliente(clienteId),
      vehiculos: this.api.getVehiculos()
    }).subscribe({
      next: ({ pedidos, vehiculos }) => {
        this.items.set(pedidos);
        this.vehiculos.set(vehiculos.filter((v) => v.estado === 'DISPONIBLE'));
        this.loading.set(false);
        this.syncSelected(pedidos);
        this.aplicarFocoDesdeRuta();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudieron cargar tus pedidos');
      }
    });
  }

  openCreate(): void {
    this.dialog
      .open(PedidoFormDialogComponent, {
        context: {
          clientes: this.clientes(),
          vehiculos: this.vehiculos(),
          modoCliente: this.isCliente(),
          clienteIdFijo: this.auth.clienteId()
        },
        closeOnBackdropClick: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.load();
      });
  }

  ver(p: Pedido): void {
    this.selected.set(p);
    this.entregaResultado.set(null);
    this.imagenFallida.update((s) => {
      const n = new Set(s);
      n.delete(p.id);
      return n;
    });
  }

  codigoDisplay(p: Pedido): string {
    return p.codigo ? `#${p.codigo}` : `#PED-${String(p.id).padStart(3, '0')}`;
  }

  estadoLabel(estado: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      PENDIENTE: 'Pendiente',
      CONFIRMADO: 'En Proceso',
      EN_IMPORTACION: 'En Aduana',
      ENTREGADO: 'Completado',
      CANCELADO: 'Cancelado'
    };
    return map[estado] ?? estado;
  }

  estadoStatus(estado: EstadoPedido): 'warning' | 'info' | 'primary' | 'success' | 'danger' | 'basic' {
    const map: Record<EstadoPedido, 'warning' | 'info' | 'primary' | 'success' | 'danger'> = {
      PENDIENTE: 'warning',
      CONFIRMADO: 'info',
      EN_IMPORTACION: 'primary',
      ENTREGADO: 'success',
      CANCELADO: 'danger'
    };
    return map[estado] ?? 'basic';
  }

  mostrarImagen(p: Pedido): boolean {
    return !!p.vehiculoImagenUrl?.trim() && !this.imagenFallida().has(p.id);
  }

  onImagenError(id: number): void {
    this.imagenFallida.update((s) => new Set(s).add(id));
  }

  confirmar(id: number): void {
    this.api.confirmarPedido(id).subscribe({
      next: (p) => {
        this.selected.set(p);
        this.flujoResultado.set(null);
        this.load();
      },
      error: (err) => this.error.set(err?.error?.detail ?? 'Error al aprobar')
    });
  }

  iniciarImportacion(id: number): void {
    this.api.iniciarImportacionPedido(id).subscribe({
      next: (p) => {
        this.selected.set(p);
        this.flujoResultado.set(null);
        this.load();
      },
      error: (err) => this.error.set(err?.error?.detail ?? 'Error al iniciar importación')
    });
  }

  abrirEntrega(p: Pedido): void {
    if (!this.puedeEntregar(p)) return;
    this.dialog
      .open(EntregaFormDialogComponent, {
        context: { pedido: p },
        closeOnBackdropClick: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((result: EntregaCompleta | false) => {
        if (result) {
          this.entregaResultado.set(result);
          this.load();
        }
      });
  }

  cancelar(id: number): void {
    this.openConfirm({
      title: 'Cancelar pedido',
      message: '¿Cancelar este pedido? El vehículo volverá a disponible.',
      confirmLabel: 'Cancelar pedido',
      confirmStatus: 'danger'
    }).subscribe((ok) => {
      if (!ok) return;
      this.api.cancelarPedido(id).subscribe({ next: () => this.load() });
    });
  }

  puedeTomarPedido(p: Pedido): boolean {
    if (!this.auth.hasRole('VENDEDOR')) return false;
    if (p.vendedorUsername) return false;
    return p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO';
  }

  puedeGestionarPedido(p: Pedido): boolean {
    if (this.auth.hasRole('ADMIN')) return true;
    if (!this.auth.hasRole('VENDEDOR')) return false;
    const actor = this.actorUsername();
    return !!p.vendedorUsername && !!actor && p.vendedorUsername === actor;
  }

  puedeCerrarSinTomar(p: Pedido): boolean {
    if (!this.auth.hasRole('VENDEDOR')) return false;
    return !p.vendedorUsername && p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO';
  }

  tomarPedido(p: Pedido): void {
    if (!this.puedeTomarPedido(p)) return;
    this.openConfirm({
      title: 'Tomar pedido',
      message: `¿Desea tomar el pedido ${this.codigoDisplay(p)} de ${p.clienteNombre}?`,
      confirmLabel: 'Tomar',
      confirmStatus: 'success'
    }).subscribe((ok) => {
      if (!ok) return;
      this.api.tomarPedido(p.id).subscribe({
        next: (updated) => {
          this.items.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
          if (this.selected()?.id === updated.id) this.selected.set(updated);
          this.error.set(null);
        },
        error: (err) => this.error.set(err?.error?.detail ?? 'No se pudo tomar el pedido')
      });
    });
  }

  cerrarPorMotivo(p: Pedido): void {
    if (!this.canManage()) return;
    if (this.auth.hasRole('VENDEDOR') && !this.puedeGestionarPedido(p) && !this.puedeCerrarSinTomar(p)) return;

    const motivo = prompt('Motivo de cierre/cancelación del pedido:');
    if (motivo == null) return;
    const limpio = motivo.trim();
    if (!limpio) {
      this.error.set('El motivo es obligatorio');
      return;
    }
    this.api.cerrarPedido(p.id, limpio).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.detail ?? 'No se pudo cerrar el pedido')
    });
  }

  inspeccionarPedido(p: Pedido): void {
    if (!this.puedeInspeccionar(p)) return;
    this.dialog
      .open(InspeccionFormDialogComponent, {
        context: {
          pedidoId: p.id,
          vinDefault: p.vehiculoVin ?? '',
          vehiculoDefault: p.vehiculoTitulo ?? ''
        },
        closeOnBackdropClick: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.load();
      });
  }

  ejecutarFlujo(p: Pedido): void {
    if (!this.puedeIntegracionDemo(p)) return;
    this.lanzarPruebaIntegracion(p.id);
  }

  private lanzarPruebaIntegracion(pedidoId: number, foto?: File): void {
    this.flujoEjecutando.set(true);
    this.flujoResultado.set(null);
    this.error.set(null);
    this.api.ejecutarFlujoCompleto(pedidoId, foto).subscribe({
      next: (result) => {
        this.flujoEjecutando.set(false);
        this.flujoResultado.set(result);
      },
      error: (err) => {
        this.flujoEjecutando.set(false);
        this.error.set(err?.error?.detail ?? 'Error en prueba de integración');
      }
    });
  }

  pedidoCerrado(p: Pedido): boolean {
    return p.estado === 'ENTREGADO' || p.estado === 'CANCELADO';
  }

  puedeAprobar(p: Pedido): boolean {
    return this.puedeGestionarPedido(p) && p.estado === 'PENDIENTE';
  }

  puedeIniciarImportacion(p: Pedido): boolean {
    return this.puedeGestionarPedido(p) && p.estado === 'CONFIRMADO';
  }

  puedeInspeccionar(p: Pedido): boolean {
    return this.puedeGestionarPedido(p) && p.estado === 'EN_IMPORTACION';
  }

  puedeEntregar(p: Pedido): boolean {
    return this.puedeGestionarPedido(p) && p.estado === 'EN_IMPORTACION';
  }

  puedeCancelar(p: Pedido): boolean {
    return this.puedeGestionarPedido(p) && p.estado === 'PENDIENTE';
  }

  puedeCerrarMotivo(p: Pedido): boolean {
    if (!this.canManage() || this.pedidoCerrado(p)) return false;
    return this.puedeCerrarSinTomar(p) || this.puedeGestionarPedido(p);
  }

  puedeIntegracionDemo(p: Pedido): boolean {
    return (
      this.auth.hasRole('ADMIN') &&
      this.puedeGestionarPedido(p) &&
      (p.estado === 'CONFIRMADO' || p.estado === 'EN_IMPORTACION' || p.estado === 'ENTREGADO')
    );
  }

  siguienteAccion(p: Pedido): string | null {
    if (this.pedidoCerrado(p)) return null;
    const map: Partial<Record<EstadoPedido, string>> = {
      PENDIENTE: 'Siguiente paso: Aprobar el pedido para confirmar la venta.',
      CONFIRMADO: 'Siguiente paso: Iniciar importación para abrir trámite aduanero.',
      EN_IMPORTACION:
        'Siguiente paso: Inspección IA del vehículo y luego Entregar y traspasar al cliente.'
    };
    return map[p.estado] ?? null;
  }

  pasosFlujo(p: Pedido): { label: string; done: boolean; current: boolean }[] {
    const orden: EstadoPedido[] = ['PENDIENTE', 'CONFIRMADO', 'EN_IMPORTACION', 'ENTREGADO'];
    const idx = orden.indexOf(p.estado);
    const cancelado = p.estado === 'CANCELADO';
    return [
      { label: 'Pedido creado', done: !cancelado, current: p.estado === 'PENDIENTE' },
      { label: 'Aprobado', done: idx >= 1 && !cancelado, current: p.estado === 'CONFIRMADO' },
      { label: 'En importación', done: idx >= 2 && !cancelado, current: p.estado === 'EN_IMPORTACION' },
      { label: 'Entregado', done: p.estado === 'ENTREGADO', current: p.estado === 'ENTREGADO' }
    ];
  }

  private openConfirm(opts: {
    title: string;
    message: string;
    confirmLabel: string;
    confirmStatus: ConfirmDialogStatus;
    cancelLabel?: string;
  }): Observable<boolean> {
    return this.dialog.open(ConfirmDialogComponent, {
      context: {
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel,
        cancelLabel: opts.cancelLabel ?? 'Cancelar',
        confirmStatus: opts.confirmStatus
      },
      closeOnBackdropClick: false,
      autoFocus: false,
      dialogClass: 'cliente-dialog-panel'
    }).onClose;
  }

  private syncSelected(pedidos: Pedido[]): void {
    const sel = this.selected();
    if (!sel) return;
    const updated = pedidos.find((p) => p.id === sel.id);
    this.selected.set(updated ?? null);
  }

  private aplicarFocoDesdeRuta(): void {
    const raw = this.route.snapshot.queryParamMap.get('focusId');
    if (!raw) return;
    const id = Number(raw);
    if (!Number.isFinite(id)) return;
    const pedido = this.items().find((p) => p.id === id);
    if (pedido) this.ver(pedido);
  }
}
