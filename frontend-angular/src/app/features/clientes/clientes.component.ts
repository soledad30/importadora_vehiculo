import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { ApiService } from '../../core/services/api.service';
import { Cliente, TipoCliente } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import {
  ClienteDialogContext,
  ClienteFormDialogComponent
} from './cliente-form-dialog.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    FormsModule,
    NbCardModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(NbDialogService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  readonly items = signal<Cliente[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly showFilters = signal(false);
  readonly filterTipo = signal<TipoCliente | 'TODOS'>('TODOS');
  readonly filterEstado = signal<'TODOS' | 'ACTIVO' | 'INACTIVO'>('TODOS');
  readonly togglingId = signal<number | null>(null);
  readonly focusedId = signal<number | null>(null);

  readonly stats = computed(() => {
    const all = this.items();
    const now = new Date();
    const mes = now.getMonth();
    const anio = now.getFullYear();
    return {
      total: all.length,
      nuevosMes: all.filter((c) => {
        const d = new Date(c.creadoEn);
        return d.getMonth() === mes && d.getFullYear() === anio;
      }).length,
      vip: all.filter((c) => c.tipoCliente === 'VIP').length,
      inactivos: all.filter((c) => !c.activo).length
    };
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const tipo = this.filterTipo();
    const estado = this.filterEstado();

    return this.items().filter((c) => {
      if (tipo !== 'TODOS' && c.tipoCliente !== tipo) return false;
      if (estado === 'ACTIVO' && !c.activo) return false;
      if (estado === 'INACTIVO' && c.activo) return false;
      if (!q) return true;
      const haystack = [
        c.codigo,
        c.nombreCompleto,
        c.nombres,
        c.apellidos,
        c.email,
        c.telefono,
        c.numeroDocumento,
        c.ciudad
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getClientes().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
        this.aplicarFocoDesdeRuta();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudo cargar clientes');
      }
    });
  }

  openCreate(): void {
    this.openDialog({ mode: 'create' });
  }

  openView(c: Cliente): void {
    this.openDialog({ mode: 'view', cliente: c });
  }

  openEdit(c: Cliente): void {
    this.openDialog({ mode: 'edit', cliente: c });
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  toggleActivo(c: Cliente): void {
    this.togglingId.set(c.id);
    this.error.set(null);
    this.api.toggleClienteActivo(c.id).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.togglingId.set(null);
      },
      error: (err) => {
        this.togglingId.set(null);
        this.error.set(err?.error?.detail ?? 'No se pudo cambiar el estado del cliente');
      }
    });
  }

  tomarCliente(c: Cliente): void {
    if (!this.auth.hasRole('VENDEDOR')) return;
    if (!confirm(`¿Tomar este cliente para tu cartera? (${c.nombreCompleto})`)) return;
    this.togglingId.set(c.id);
    this.api.asignarClienteAMi(c.id).subscribe({
      next: (updated) => {
        this.items.update((arr) => arr.map((x) => (x.id === updated.id ? updated : x)));
        this.togglingId.set(null);
      },
      error: (err) => {
        this.togglingId.set(null);
        this.error.set(err?.error?.detail ?? 'No se pudo asignar el cliente');
      }
    });
  }

  codigoDisplay(c: Cliente): string {
    return c.codigo ? `#${c.codigo}` : `#CLI-${String(c.id).padStart(3, '0')}`;
  }

  tipoLabel(tipo: TipoCliente): string {
    const map: Record<TipoCliente, string> = {
      VIP: 'VIP',
      REGULAR: 'Regular',
      NUEVO: 'Nuevo'
    };
    return map[tipo];
  }

  tipoClass(tipo: TipoCliente): string {
    return `tipo-${tipo.toLowerCase()}`;
  }

  private aplicarFocoDesdeRuta(): void {
    const raw = this.route.snapshot.queryParamMap.get('focusId');
    if (!raw) return;
    const id = Number(raw);
    if (!Number.isFinite(id)) return;
    const cliente = this.items().find((c) => c.id === id);
    if (!cliente) return;
    this.focusedId.set(id);
    this.openView(cliente);
  }

  private openDialog(ctx: ClienteDialogContext): void {
    this.dialog
      .open(ClienteFormDialogComponent, {
        context: {
          mode: ctx.mode,
          cliente: ctx.cliente
        },
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.load();
      });
  }
}
