import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbDialogService,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { forkJoin } from 'rxjs';
import { Proveedor } from '../../core/models/ms-extensions';
import { Ms2Service } from '../../core/services/ms2.service';
import { ProveedorFormDialogComponent } from './proveedor-form-dialog.component';
import { ProveedorDetailDialogComponent } from './proveedor-detail-dialog.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [NbCardModule, NbButtonModule, NbSpinnerModule, NbIconModule, NbAlertModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.scss'
})
export class ProveedoresComponent implements OnInit {
  private readonly ms2 = inject(Ms2Service);
  private readonly dialog = inject(NbDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly proveedores = signal<Proveedor[]>([]);
  readonly resumen = signal({ subastas: 0, navieras: 0, dealers: 0, agentes: 0 });
  readonly loading = signal(true);
  readonly contextoPlan = signal<{ marca: string; modelo: string; cantidad: number } | null>(null);

  readonly subastas = computed(() => this.proveedores().filter((p) => p.tipo === 'SUBASTA'));
  readonly navieras = computed(() => this.proveedores().filter((p) => p.tipo === 'NAVIERA'));
  readonly agentes = computed(() => this.proveedores().filter((p) => p.tipo === 'AGENTE'));
  readonly dealers = computed(() => this.proveedores().filter((p) => p.tipo === 'DEALER'));

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('from') === 'plan') {
        this.contextoPlan.set({
          marca: params.get('marca') ?? 'Toyota',
          modelo: params.get('modelo') ?? 'Hilux',
          cantidad: Number(params.get('cantidad') ?? 1)
        });
      } else {
        this.contextoPlan.set(null);
      }
    });

    forkJoin({
      proveedores: this.ms2.getProveedores(),
      resumen: this.ms2.getResumenProveedores()
    }).subscribe({
      next: ({ proveedores, resumen }) => {
        this.proveedores.set(proveedores);
        this.resumen.set(resumen);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.dialog
      .open(ProveedorFormDialogComponent, {
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => { if (saved) this.ngOnInit(); });
  }

  cerrarContextoPlan(): void {
    this.contextoPlan.set(null);
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  planVehiculoLabel(): string | null {
    const ctx = this.contextoPlan();
    if (!ctx) return null;
    return `${ctx.cantidad} ${ctx.marca} ${ctx.modelo}`;
  }

  verProveedor(p: Proveedor): void {
    const ctx = this.contextoPlan();
    this.dialog
      .open(ProveedorDetailDialogComponent, {
        closeOnBackdropClick: true,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel',
        context: {
          proveedor: p,
          planVehiculo: ctx ? this.planVehiculoLabel() : null,
          planMarca: ctx?.marca ?? '',
          planModelo: ctx?.modelo ?? '',
          planCantidad: ctx?.cantidad ?? 1
        }
      })
      .onClose.subscribe();
  }

  colorClass(color: string): string {
    return `color-${color}`;
  }
}
