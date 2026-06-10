import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  NbCardModule,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesBadgeService } from '../../core/services/notificaciones-badge.service';
import { Ms2Service } from '../../core/services/ms2.service';
import { destinoNotificacion } from '../../core/utils/notificacion-nav.util';
import { NotificacionItem, NivelNotificacion, Pedido, ReporteResumen } from '../../core/models';

type VentasVista = 'mensual' | 'anual';

interface ActividadReciente {
  vehiculo: string;
  cliente: string;
  estado: string;
  estadoClass: string;
  monto: number;
}

interface SegmentoVenta {
  label: string;
  porcentaje: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    NbCardModule,
    NbIconModule,
    NbSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ms2 = inject(Ms2Service);
  private readonly router = inject(Router);
  private readonly notifBadge = inject(NotificacionesBadgeService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly ventasVista = signal<VentasVista>('mensual');

  readonly vehiculosStock = signal(0);
  readonly pedidosActivos = signal(0);
  readonly ventasMes = signal(0);
  readonly enTransito = signal(0);
  readonly actividad = signal<ActividadReciente[]>([]);

  readonly notifItems = signal<NotificacionItem[]>([]);
  readonly prediccionDemanda = signal<number | null>(null);
  readonly totalAnomalias = signal<number | null>(null);
  readonly tendenciaHistorica = signal<string | null>(null);

  readonly segmentosMensual = signal<SegmentoVenta[]>([
    { label: 'SUV', porcentaje: 38, color: '#3366ff' },
    { label: 'Sedán', porcentaje: 27, color: '#00d68f' },
    { label: 'Pickup', porcentaje: 20, color: '#a855f7' },
    { label: 'Otros', porcentaje: 15, color: '#ffaa00' }
  ]);

  readonly barrasMensual = signal([62, 78, 55, 90, 72]);
  readonly barrasAnual = signal([45, 58, 70, 65, 82, 88, 75, 92, 68, 95, 80, 100]);

  readonly pieGradient = computed(() => {
    const segs = this.segmentosMensual();
    let acc = 0;
    const parts = segs.map((s) => {
      const start = acc;
      acc += s.porcentaje;
      return `${s.color} ${start}% ${acc}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  });

  readonly ventasTitulo = computed(() =>
    this.ventasVista() === 'mensual' ? 'Ventas Mensuales' : 'Ventas Anuales'
  );

  readonly barrasActuales = computed(() =>
    this.ventasVista() === 'mensual' ? this.barrasMensual() : this.barrasAnual()
  );

  readonly ventasDisplay = computed(() => {
    const v = this.ventasMes();
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
    return `$${Math.round(v)}`;
  });

  readonly isCliente = () => this.auth.hasRole('CLIENTE');
  readonly canOps = () => this.auth.hasRole('ADMIN', 'VENDEDOR');

  ngOnInit(): void {
    const canOps = this.canOps();
    const isVendedor = this.auth.hasRole('VENDEDOR');
    const clienteId = this.auth.clienteId();
    const pedidos$ = canOps
      ? this.api.getPedidos().pipe(catchError(() => of([] as Pedido[])))
      : clienteId
        ? this.api.getPedidosPorCliente(clienteId).pipe(catchError(() => of([] as Pedido[])))
        : of([] as Pedido[]);

    forkJoin({
      vehiculos: this.api.getVehiculos(),
      pedidos: pedidos$,
      reporte: canOps
        ? (isVendedor ? this.api.getMiReporteResumen() : this.api.getReporteResumen())
            .pipe(catchError(() => of(null as ReporteResumen | null)))
        : of(null),
      importResumen: canOps
        ? this.ms2.getResumenImportaciones().pipe(catchError(() => of({ enTransito: 0, enAduana: 0, pendientePago: 0, completadasMes: 0 })))
        : of({ enTransito: 0, enAduana: 0, pendientePago: 0, completadasMes: 0 }),
      prediccion: canOps
        ? this.ms2.getPrediccionDemanda(3).pipe(catchError(() => of(null)))
        : of(null),
      anomalias: canOps
        ? this.ms2.getAnomalias().pipe(catchError(() => of(null)))
        : of(null),
      historico: canOps
        ? this.ms2.getAnalisisHistorico().pipe(catchError(() => of(null)))
        : of(null),
      notifs: this.api.getNotificaciones().pipe(catchError(() => of([] as NotificacionItem[])))
    }).subscribe({
      next: ({ vehiculos, pedidos, reporte, importResumen, prediccion, anomalias, historico, notifs }) => {
        const stock = vehiculos.filter((v) => v.estado === 'DISPONIBLE').length;
        const activos = pedidos.filter(
          (p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO'
        ).length;

        this.vehiculosStock.set(stock || vehiculos.length);
        this.pedidosActivos.set(activos);
        this.ventasMes.set(
          canOps ? (reporte?.ventasMesActual ?? this.sumEntregados(pedidos)) : this.sumEntregados(pedidos)
        );
        this.enTransito.set(importResumen.enTransito);
        this.prediccionDemanda.set(prediccion?.totalProyectado ?? null);
        this.totalAnomalias.set(anomalias?.totalAnomalias ?? null);
        this.tendenciaHistorica.set(historico?.tendencia ?? null);

        if (historico?.serieMensual?.length) {
          const max = Math.max(...historico.serieMensual.map((s) => s.pedidos), 1);
          this.barrasMensual.set(historico.serieMensual.slice(-5).map((s) => Math.round((s.pedidos / max) * 100)));
        }

        const actividad = [...pedidos]
          .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
          .slice(0, 5)
          .map((p) => ({
            vehiculo: p.vehiculoTitulo || p.vehiculoDescripcion,
            cliente: p.clienteNombre,
            estado: this.estadoLabel(p.estado),
            estadoClass: this.estadoClass(p.estado),
            monto: p.total
          }));

        if (actividad.length) {
          this.actividad.set(actividad);
        } else if (canOps) {
          this.actividad.set(this.actividadDemo());
        } else {
          this.actividad.set([]);
        }

        this.notifItems.set(notifs.slice(0, 5));
        this.notifBadge.actualizar();

        this.loading.set(false);
      },
      error: () => {
        if (canOps) {
          this.setDemoFallback();
        }
        this.loading.set(false);
      }
    });
  }

  setVentasVista(vista: VentasVista): void {
    this.ventasVista.set(vista);
  }

  barColor(i: number): string {
    const colors = ['#3366ff', '#00d68f', '#a855f7', '#ffaa00', '#ff3d71', '#5b7cff'];
    return colors[i % colors.length];
  }

  private sumEntregados(pedidos: Pedido[]): number {
    return pedidos
      .filter((p) => p.estado === 'ENTREGADO')
      .reduce((sum, p) => sum + p.total, 0);
  }

  private estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      CONFIRMADO: 'Confirmado',
      EN_IMPORTACION: 'En Tránsito',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado'
    };
    return map[estado] ?? estado;
  }

  private estadoClass(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'estado-pendiente',
      CONFIRMADO: 'estado-proceso',
      EN_IMPORTACION: 'estado-transito',
      ENTREGADO: 'estado-entregado',
      CANCELADO: 'estado-cancelado'
    };
    return map[estado] ?? 'estado-proceso';
  }

  private actividadDemo(): ActividadReciente[] {
    return [
      { vehiculo: 'Toyota RAV4 2024', cliente: 'Carlos M.', estado: 'Entregado', estadoClass: 'estado-entregado', monto: 38500 },
      { vehiculo: 'Honda CR-V 2023', cliente: 'María L.', estado: 'En Tránsito', estadoClass: 'estado-transito', monto: 35200 },
      { vehiculo: 'Nissan Rogue 2024', cliente: 'José R.', estado: 'En Aduana', estadoClass: 'estado-proceso', monto: 32800 },
      { vehiculo: 'Mazda CX-5 2024', cliente: 'Ana P.', estado: 'Confirmado', estadoClass: 'estado-proceso', monto: 31500 }
    ];
  }

  tipoNotif(nivel: NivelNotificacion): 'info' | 'success' | 'warning' | 'danger' {
    const map: Record<NivelNotificacion, 'info' | 'success' | 'warning' | 'danger'> = {
      INFO: 'info',
      EXITO: 'success',
      ADVERTENCIA: 'warning',
      CRITICO: 'danger'
    };
    return map[nivel] ?? 'info';
  }

  tieneDestinoNotif(n: NotificacionItem): boolean {
    return destinoNotificacion(n, this.auth.rol()) != null;
  }

  abrirNotif(n: NotificacionItem): void {
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
      next: () => {
        this.notifBadge.decrementar();
        navegar();
      },
      error: () => navegar()
    });
  }

  iconoNotif(n: NotificacionItem): string {
    const byCat: Record<string, string> = {
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

  private setDemoFallback(): void {
    this.vehiculosStock.set(152);
    this.pedidosActivos.set(48);
    this.ventasMes.set(2_400_000);
    this.enTransito.set(12);
    this.actividad.set(this.actividadDemo());
  }
}
