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
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Cliente, EstadoPedido, Pedido, Vehiculo } from '../../core/models';
import { PedidoFormDialogComponent } from './pedido-form-dialog.component';

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

    this.api.getPedidosPorCliente(clienteId).subscribe({
      next: (pedidos) => {
        this.items.set(pedidos);
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
          vehiculos: this.vehiculos()
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
        this.load();
      },
      error: (err) => this.error.set(err?.error?.detail ?? 'Error al aprobar')
    });
  }

  iniciarImportacion(id: number): void {
    this.api.iniciarImportacionPedido(id).subscribe({
      next: (p) => {
        this.selected.set(p);
        this.load();
      }
    });
  }

  entregar(id: number): void {
    this.api.entregarPedido(id).subscribe({
      next: (p) => {
        this.selected.set(p);
        this.load();
      }
    });
  }

  cancelar(id: number): void {
    if (!confirm('¿Cancelar este pedido? El vehículo volverá a disponible.')) return;
    this.api.cancelarPedido(id).subscribe({ next: () => this.load() });
  }

  tomarPedido(p: Pedido): void {
    if (!this.auth.hasRole('VENDEDOR')) return;
    if (p.vendedorUsername) return;
    this.api.tomarPedido(p.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.detail ?? 'No se pudo tomar el pedido')
    });
  }

  cerrarPorMotivo(p: Pedido): void {
    if (!this.canManage()) return;
    const actor = this.actorUsername();
    if (this.auth.hasRole('VENDEDOR') && p.vendedorUsername && actor && p.vendedorUsername !== actor) return;

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
