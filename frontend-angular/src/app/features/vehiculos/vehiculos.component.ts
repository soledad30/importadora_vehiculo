import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
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
import { logoMarcaVehiculo, nombresMarcasVehiculo } from '../../core/constants/marcas-vehiculo';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CompraOrigen, Vehiculo } from '../../core/models';
import { CompraOrigenDialogComponent } from './compra-origen-dialog.component';
import {
  VehiculoDialogContext,
  VehiculoFormDialogComponent
} from './vehiculo-form-dialog.component';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    NbCardModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule
  ],
  templateUrl: './vehiculos.component.html',
  styleUrl: './vehiculos.component.scss'
})
export class VehiculosComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(NbDialogService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  readonly items = signal<Vehiculo[]>([]);
  readonly comprasPorVehiculo = signal<Record<number, CompraOrigen>>({});
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly showFilters = signal(false);
  readonly filterEstado = signal<string>('TODOS');
  readonly filterMarca = signal<string>('TODAS');
  readonly marcasDisponibles = nombresMarcasVehiculo();
  readonly imagenFallida = signal<Set<number>>(new Set());
  readonly focusedId = signal<number | null>(null);

  readonly canEdit = () => this.auth.hasRole('ADMIN', 'VENDEDOR');

  readonly disponiblesCount = computed(
    () => this.items().filter((v) => v.estado === 'DISPONIBLE').length
  );

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const estado = this.filterEstado();
    const marca = this.filterMarca();
    return this.items().filter((v) => {
      if (estado !== 'TODOS' && v.estado !== estado) return false;
      if (marca !== 'TODAS' && v.marca !== marca) return false;
      if (!q) return true;
      const haystack = [v.vin, v.marca, v.modelo, v.color, String(v.anio), v.estado]
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
    this.api.getVehiculos().subscribe({
      next: (data) => {
        this.items.set(data);
        this.imagenFallida.set(new Set());
        this.loading.set(false);
        this.aplicarFocoDesdeRuta();
        if (this.canEdit()) this.loadCompras();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudo cargar el catálogo');
      }
    });
  }

  openCreate(): void {
    this.openDialog({ mode: 'create' });
  }

  openEdit(v: Vehiculo): void {
    this.openDialog({ mode: 'edit', vehiculo: v });
  }

  openCompraOrigen(v: Vehiculo): void {
    if (this.comprasPorVehiculo()[v.id]) {
      this.error.set('Este vehículo ya tiene compra en origen registrada');
      return;
    }
    this.dialog
      .open(CompraOrigenDialogComponent, {
        context: { vehiculo: v },
        closeOnBackdropClick: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.load();
      });
  }

  compraDe(v: Vehiculo): CompraOrigen | undefined {
    return this.comprasPorVehiculo()[v.id];
  }

  labelProveedor(tipo: string): string {
    const map: Record<string, string> = {
      SUBASTA: 'Subasta',
      DEALER: 'Dealer',
      PRIVADO: 'Privado'
    };
    return map[tipo] ?? tipo;
  }

  toggleFilters(): void {
    this.showFilters.update((x) => !x);
  }

  tituloVehiculo(v: Vehiculo): string {
    return `${v.marca} ${v.modelo} ${v.anio}`;
  }

  logoMarca(marca: string): string | null {
    return logoMarcaVehiculo(marca);
  }

  mostrarImagen(v: Vehiculo): boolean {
    const url = v.imagenUrl?.trim();
    return !!url && !this.imagenFallida().has(v.id);
  }

  onImagenError(id: number): void {
    this.imagenFallida.update((set) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
  }

  estadoStatus(estado: string): 'success' | 'warning' | 'basic' | 'danger' {
    const map: Record<string, 'success' | 'warning' | 'basic' | 'danger'> = {
      DISPONIBLE: 'success',
      RESERVADO: 'warning',
      EN_IMPORTACION: 'warning',
      VENDIDO: 'basic'
    };
    return map[estado] ?? 'basic';
  }

  delete(v: Vehiculo, event: Event): void {
    event.stopPropagation();
    if (!this.auth.hasRole('ADMIN') || !confirm(`¿Eliminar ${this.tituloVehiculo(v)}?`)) return;
    this.api.deleteVehiculo(v.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.detail ?? 'No se pudo eliminar')
    });
  }

  private loadCompras(): void {
    this.api.getComprasOrigen().subscribe({
      next: (compras) => {
        const map: Record<number, CompraOrigen> = {};
        for (const c of compras) map[c.vehiculoId] = c;
        this.comprasPorVehiculo.set(map);
      },
      error: () => this.comprasPorVehiculo.set({})
    });
  }

  private aplicarFocoDesdeRuta(): void {
    const raw = this.route.snapshot.queryParamMap.get('focusId');
    if (!raw) return;
    const id = Number(raw);
    if (!Number.isFinite(id)) return;
    if (this.items().some((v) => v.id === id)) {
      this.focusedId.set(id);
    }
  }

  private openDialog(ctx: VehiculoDialogContext): void {
    this.dialog
      .open(VehiculoFormDialogComponent, {
        context: { mode: ctx.mode, vehiculo: ctx.vehiculo },
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.load();
      });
  }
}
