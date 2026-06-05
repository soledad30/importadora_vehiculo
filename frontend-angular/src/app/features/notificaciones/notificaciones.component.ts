import { DatePipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesBadgeService } from '../../core/services/notificaciones-badge.service';
import { destinoNotificacion } from '../../core/utils/notificacion-nav.util';
import { CategoriaNotificacion, NotificacionItem, NivelNotificacion } from '../../core/models';

type FiltroTab = 'TODAS' | CategoriaNotificacion;

interface TabConfig {
  id: FiltroTab;
  label: string;
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [
    DatePipe,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbSpinnerModule,
    NbAlertModule
  ],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss'
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly badge = inject(NotificacionesBadgeService);
  readonly auth = inject(AuthService);

  private refreshTimer?: ReturnType<typeof setInterval>;
  private readonly refreshMs = 30_000;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<NotificacionItem[]>([]);
  readonly filtro = signal<FiltroTab>('TODAS');
  readonly noLeidas = this.badge.noLeidas;

  readonly tabs = computed((): TabConfig[] => {
    if (this.auth.hasRole('ADMIN')) {
      return [
        { id: 'TODAS', label: 'Todas' },
        { id: 'STOCK', label: 'Stock' },
        { id: 'IMPORTACION', label: 'Importaciones' },
        { id: 'DOCUMENTO', label: 'Documentos' },
        { id: 'CLIENTE', label: 'Clientes' },
        { id: 'PREDICCION', label: 'Predicción' }
      ];
    }
    if (this.auth.hasRole('VENDEDOR')) {
      return [
        { id: 'TODAS', label: 'Todas' },
        { id: 'CLIENTE', label: 'Clientes' },
        { id: 'PEDIDO', label: 'Pedidos' },
        { id: 'VEHICULO', label: 'Vehículos' }
      ];
    }
    return [
      { id: 'TODAS', label: 'Todas' },
      { id: 'VEHICULO', label: 'Vehículos' },
      { id: 'PEDIDO', label: 'Mis pedidos' }
    ];
  });

  readonly filtered = computed(() => {
    const f = this.filtro();
    const all = this.items();
    if (f === 'TODAS') return all;
    return all.filter((n) => n.categoria === f);
  });

  readonly subtitle = computed(() => {
    if (this.auth.hasRole('ADMIN')) {
      return 'Alertas del sistema — stock, importaciones, documentos y operaciones';
    }
    if (this.auth.hasRole('VENDEDOR')) {
      return 'Clientes sin asignar, pedidos pendientes y novedades de ventas';
    }
    return 'Nuevos vehículos disponibles y seguimiento de tu proceso de compra';
  });

  ngOnInit(): void {
    this.cargar(true);
    this.refreshTimer = setInterval(() => this.cargar(false), this.refreshMs);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  cargar(mostrarSpinner: boolean): void {
    if (mostrarSpinner) {
      this.loading.set(true);
      this.error.set(null);
    }
    this.api.getNotificaciones().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        if (mostrarSpinner) {
          this.loading.set(false);
          this.error.set(err?.error?.detail ?? 'No se pudieron cargar las notificaciones');
        }
      }
    });
    this.badge.actualizar();
  }

  setFiltro(tab: FiltroTab): void {
    this.filtro.set(tab);
  }

  tieneDestino(n: NotificacionItem): boolean {
    return destinoNotificacion(n, this.auth.rol()) != null;
  }

  abrir(n: NotificacionItem): void {
    const destino = destinoNotificacion(n, this.auth.rol());
    const navegar = () => {
      if (!destino) return;
      void this.router.navigate([destino.path], { queryParams: destino.queryParams });
    };

    if (n.leida) {
      navegar();
      return;
    }

    this.api.marcarNotificacionLeida(n.id).subscribe({
      next: (updated) => {
        this.items.update((arr) => arr.map((x) => (x.id === updated.id ? updated : x)));
        this.badge.decrementar();
        navegar();
      },
      error: () => navegar()
    });
  }

  marcarTodas(): void {
    this.api.marcarTodasNotificacionesLeidas().subscribe({
      next: () => {
        this.items.update((arr) => arr.map((x) => ({ ...x, leida: true })));
        this.badge.limpiar();
      }
    });
  }

  categoriaLabel(cat: CategoriaNotificacion): string {
    const map: Record<CategoriaNotificacion, string> = {
      STOCK: 'STOCK',
      VEHICULO: 'VEHÍCULO',
      IMPORTACION: 'IMPORTACIÓN',
      DOCUMENTO: 'DOCUMENTO',
      CLIENTE: 'CLIENTE',
      PEDIDO: 'PEDIDO',
      FACTURA: 'FACTURA',
      SISTEMA: 'SISTEMA',
      BLOCKCHAIN: 'BLOCKCHAIN',
      PROVEEDOR: 'PROVEEDOR',
      PREDICCION: 'PREDICCIÓN ML'
    };
    return map[cat] ?? cat;
  }

  nivelClass(nivel: NivelNotificacion): string {
    const map: Record<NivelNotificacion, string> = {
      INFO: 'nivel-info',
      EXITO: 'nivel-exito',
      ADVERTENCIA: 'nivel-advertencia',
      CRITICO: 'nivel-critico'
    };
    return map[nivel] ?? 'nivel-info';
  }

  icono(n: NotificacionItem): string {
    const byCat: Partial<Record<CategoriaNotificacion, string>> = {
      STOCK: 'alert-triangle-outline',
      VEHICULO: 'car-outline',
      IMPORTACION: 'globe-outline',
      DOCUMENTO: 'file-text-outline',
      CLIENTE: 'person-add-outline',
      PEDIDO: 'shopping-cart-outline',
      BLOCKCHAIN: 'link-2-outline',
      PROVEEDOR: 'briefcase-outline',
      PREDICCION: 'bar-chart-outline'
    };
    return byCat[n.categoria] ?? 'bell-outline';
  }
}
