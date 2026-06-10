import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbCardModule, NbSpinnerModule } from '@nebular/theme';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
  LoteImportacion,
  NotificacionItem,
  NivelNotificacion,
  Pedido,
  ReporteImportaciones,
  ReporteResumen
} from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Ms2Service } from '../../core/services/ms2.service';
import { NotificacionesBadgeService } from '../../core/services/notificaciones-badge.service';

interface KpiCard {
  value: string;
  label: string;
  hint: string;
  link?: string;
  tone: 'blue' | 'green' | 'amber' | 'purple';
}

interface BarMes {
  label: string;
  height: number;
}

interface EstadoImportacion {
  label: string;
  count: number;
  color: string;
  pct: number;
}

interface ActividadItem {
  titulo: string;
  subtitulo: string;
  tiempo: string;
  tone: 'green' | 'blue' | 'purple' | 'amber' | 'cyan';
}

interface TopVendedorItem {
  rank: number;
  nombre: string;
  ventasLabel: string;
  montoLabel: string;
  tone: 'amber' | 'blue' | 'green' | 'purple';
}

interface ImportResumen {
  enTransito: number;
  enAduana: number;
  pendientePago: number;
  completadasMes: number;
}

interface AdminDashboardSnapshot {
  vehiculos: { estado: string; marca?: string; modelo?: string }[];
  pedidos: Pedido[];
  reporte: ReporteResumen | null;
  lotes: LoteImportacion[];
  reporteImport: ReporteImportaciones | null;
  notifs: NotificacionItem[];
  importResumen: ImportResumen;
  proximasLlegadas: { diasRestantes: number }[];
  historico: { serieMensual: { mes: string; pedidos: number; ventas: number }[]; tendencia: string } | null;
}

const IMPORT_RESUMEN_DEFAULT: ImportResumen = {
  enTransito: 0,
  enAduana: 0,
  pendientePago: 0,
  completadasMes: 0
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, NbCardModule, NbSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ms2 = inject(Ms2Service);
  private readonly notifBadge = inject(NotificacionesBadgeService);
  readonly auth = inject(AuthService);

  /** Timeout solo para MS-2 (si no está levantado, no esperar). */
  private static readonly MS2_TIMEOUT_MS = 3000;

  readonly loading = signal(true);
  readonly actualizadoEn = signal(new Date());

  readonly kpiCards = signal<KpiCard[]>([]);
  readonly barrasVentas = signal<BarMes[]>([]);
  readonly estadosImportacion = signal<EstadoImportacion[]>([]);
  readonly actividad = signal<ActividadItem[]>([]);
  readonly topVendedores = signal<TopVendedorItem[]>([]);
  readonly alertas = signal<string[]>([]);

  readonly welcomeName = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return 'Usuario';
    if (user.rol === 'CLIENTE' && user.clienteNombre) return user.clienteNombre;
    return user.username.charAt(0).toUpperCase() + user.username.slice(1);
  });

  readonly isCliente = () => this.auth.hasRole('CLIENTE');
  readonly canOps = () => this.auth.hasRole('ADMIN', 'VENDEDOR');

  ngOnInit(): void {
    const canOps = this.canOps();
    const isVendedor = this.auth.hasRole('VENDEDOR');
    const clienteId = this.auth.clienteId();

    if (canOps) {
      this.applySkeletonAdmin();
      this.loadAdminDashboard(isVendedor);
    } else {
      this.loadClienteDashboard(clienteId);
    }

    this.loading.set(false);
  }

  /** Carga incremental: cada respuesta actualiza el dashboard sin bloquear la UI. */
  private loadAdminDashboard(isVendedor: boolean): void {
    const snapshot: AdminDashboardSnapshot = {
      vehiculos: [],
      pedidos: [],
      reporte: null,
      lotes: [],
      reporteImport: null,
      notifs: [],
      importResumen: { ...IMPORT_RESUMEN_DEFAULT },
      proximasLlegadas: [],
      historico: null
    };

    const refresh = () => {
      this.actualizadoEn.set(new Date());
      this.buildAdminDashboard(snapshot);
    };

    // Reporte = KPIs agregados en una sola llamada (la más importante)
    this.fromApi(
      isVendedor ? this.api.getMiReporteResumen() : this.api.getReporteResumen(),
      null as ReporteResumen | null
    ).subscribe((reporte) => {
      snapshot.reporte = reporte;
      refresh();
    });

    this.fromApi(this.api.getPedidos(), [] as Pedido[]).subscribe((pedidos) => {
      snapshot.pedidos = pedidos;
      refresh();
    });

    this.fromApi(this.api.getNotificaciones(), [] as NotificacionItem[]).subscribe((notifs) => {
      snapshot.notifs = notifs;
      refresh();
      this.notifBadge.actualizar();
    });

    this.fromApi(this.api.getVehiculos(), []).subscribe((vehiculos) => {
      snapshot.vehiculos = vehiculos;
      refresh();
    });

    this.fromApi(this.api.getLotes(), [] as LoteImportacion[]).subscribe((lotes) => {
      snapshot.lotes = lotes;
      refresh();
    });

    this.fromApi(this.api.getReporteImportaciones(), null as ReporteImportaciones | null).subscribe(
      (reporteImport) => {
        snapshot.reporteImport = reporteImport;
        refresh();
      }
    );

    this.fromMs2(this.ms2.getResumenImportaciones(), IMPORT_RESUMEN_DEFAULT).subscribe((importResumen) => {
      snapshot.importResumen = importResumen;
      refresh();
    });

    this.fromMs2(this.ms2.getProximasLlegadas(), [] as { diasRestantes: number }[]).subscribe(
      (proximasLlegadas) => {
        snapshot.proximasLlegadas = proximasLlegadas;
        refresh();
      }
    );

    this.fromMs2(this.ms2.getAnalisisHistorico(), null).subscribe((historico) => {
      snapshot.historico = historico;
      refresh();
    });
  }

  private loadClienteDashboard(clienteId: number | null | undefined): void {
    if (!clienteId) {
      this.buildClienteDashboard([], []);
      return;
    }

    this.fromApi(this.api.getPedidosPorCliente(clienteId), [] as Pedido[]).subscribe((pedidos) => {
      this.fromApi(this.api.getNotificaciones(), [] as NotificacionItem[]).subscribe((notifs) => {
        this.actualizadoEn.set(new Date());
        this.buildClienteDashboard(pedidos, notifs);
        this.notifBadge.actualizar();
      });
    });
  }

  private applySkeletonAdmin(): void {
    this.kpiCards.set([
      { value: '—', label: 'Vehículos', hint: 'Cargando…', link: '/vehiculos', tone: 'blue' },
      { value: '—', label: 'Ventas Mes', hint: 'Cargando…', link: '/reportes', tone: 'green' },
      { value: '—', label: 'En Tránsito', hint: 'Cargando…', link: '/importaciones', tone: 'amber' },
      { value: '—', label: 'Satisfacción', hint: 'Cargando…', tone: 'purple' }
    ]);
    this.barrasVentas.set(this.buildBarrasVentas(this.serieDemo()));
    this.estadosImportacion.set([
      { label: 'En Subasta', count: 0, color: '#3366ff', pct: 8 },
      { label: 'Embarcados', count: 0, color: '#ffaa00', pct: 8 },
      { label: 'En Tránsito', count: 0, color: '#a855f7', pct: 8 },
      { label: 'En Aduana', count: 0, color: '#ff3d71', pct: 8 },
      { label: 'En Lote', count: 0, color: '#00d68f', pct: 8 }
    ]);
    this.actividad.set([]);
    this.topVendedores.set([]);
    this.alertas.set([]);
  }

  private fromApi<T>(source: Observable<T>, fallback: T): Observable<T> {
    return source.pipe(catchError(() => of(fallback)));
  }

  private fromMs2<T>(source: Observable<T>, fallback: T): Observable<T> {
    return source.pipe(
      timeout(DashboardComponent.MS2_TIMEOUT_MS),
      catchError(() => of(fallback))
    );
  }

  private buildAdminDashboard(data: {
    vehiculos: { estado: string }[];
    pedidos: Pedido[];
    reporte: ReporteResumen | null;
    importResumen: { enTransito: number; enAduana: number; pendientePago: number; completadasMes: number };
    proximasLlegadas: { diasRestantes: number }[];
    historico: { serieMensual: { mes: string; pedidos: number; ventas: number }[]; tendencia: string } | null;
    lotes: LoteImportacion[];
    reporteImport: ReporteImportaciones | null;
    notifs: NotificacionItem[];
  }): void {
    const { vehiculos, pedidos, reporte, importResumen, proximasLlegadas, historico, lotes, reporteImport, notifs } =
      data;

    const stock = reporte?.vehiculosDisponibles ?? vehiculos.filter((v) => v.estado === 'DISPONIBLE').length;
    const vendidosMes = reporte?.pedidosCompletados ?? pedidos.filter((p) => p.estado === 'ENTREGADO').length;
    const ventasMes = reporte?.ventasMesActual ?? this.sumEntregados(pedidos);
    const llegandoHoy = proximasLlegadas.filter((p) => p.diasRestantes <= 1).length;
    const variacionVentas = this.calcVariacionVentas(historico?.serieMensual ?? []);
    const satisfaccion = this.calcSatisfaccion(pedidos, reporte);

    this.kpiCards.set([
      {
        value: String(stock || vehiculos.length),
        label: 'Vehículos',
        hint: vendidosMes > 0 ? `+${vendidosMes} este mes` : 'Inventario activo',
        link: '/vehiculos',
        tone: 'blue'
      },
      {
        value: this.formatMonto(ventasMes),
        label: 'Ventas Mes',
        hint: variacionVentas,
        link: '/reportes',
        tone: 'green'
      },
      {
        value: String(importResumen.enTransito || importResumen.enAduana),
        label: 'En Tránsito',
        hint: llegandoHoy > 0 ? `${llegandoHoy} llegando hoy` : `${importResumen.completadasMes} completadas`,
        link: '/importaciones',
        tone: 'amber'
      },
      {
        value: `${satisfaccion}%`,
        label: 'Satisfacción',
        hint: `${Math.max(pedidos.filter((p) => p.estado === 'ENTREGADO').length, 1)} entregas`,
        tone: 'purple'
      }
    ]);

    this.barrasVentas.set(this.buildBarrasVentas(historico?.serieMensual ?? []));
    this.estadosImportacion.set(this.buildEstadosImportacion(lotes, importResumen, reporteImport, stock));
    this.actividad.set(this.buildActividadFeed(pedidos, notifs));
    this.topVendedores.set(this.buildTopVendedores(reporte, historico?.serieMensual?.[0]?.ventas ?? 35000));
    this.alertas.set(this.buildAlertas(notifs, reporteImport, vehiculos, proximasLlegadas.length));
  }

  private buildClienteDashboard(pedidos: Pedido[], notifs: NotificacionItem[]): void {
    const activos = pedidos.filter((p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO').length;
    const totalCompras = this.sumEntregados(pedidos);

    this.kpiCards.set([
      {
        value: String(activos),
        label: 'Mis Pedidos Activos',
        hint: `${pedidos.length} en total`,
        link: '/pedidos',
        tone: 'amber'
      },
      {
        value: this.formatMonto(totalCompras),
        label: 'Total Compras',
        hint: 'Pedidos entregados',
        tone: 'green'
      },
      {
        value: String(pedidos.filter((p) => p.estado === 'EN_IMPORTACION').length),
        label: 'En Importación',
        hint: 'Seguimiento activo',
        link: '/importaciones',
        tone: 'blue'
      },
      {
        value: String(pedidos.filter((p) => p.estado === 'ENTREGADO').length),
        label: 'Entregados',
        hint: 'Historial completo',
        tone: 'purple'
      }
    ]);

    this.actividad.set(
      [...pedidos]
        .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
        .slice(0, 5)
        .map((p) => ({
          titulo: `${p.vehiculoTitulo || p.vehiculoDescripcion}`,
          subtitulo: `${this.estadoLabel(p.estado)} · ${this.formatMonto(p.total)}`,
          tiempo: this.tiempoRelativo(p.creadoEn),
          tone: this.tonoPorEstado(p.estado)
        }))
    );

    this.alertas.set(
      notifs
        .filter((n) => n.nivel === 'ADVERTENCIA' || n.nivel === 'CRITICO')
        .slice(0, 3)
        .map((n) => n.mensaje)
    );
  }

  private buildBarrasVentas(serie: { mes: string; pedidos: number; ventas: number }[]): BarMes[] {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const slice = (serie.length ? serie : this.serieDemo()).slice(-6);
    const max = Math.max(...slice.map((s) => s.ventas || s.pedidos), 1);

    return slice.map((s) => ({
      label: meses.find((m) => s.mes.startsWith(m)) ?? s.mes.slice(0, 3),
      height: Math.max(12, Math.round(((s.ventas || s.pedidos) / max) * 100))
    }));
  }

  private buildEstadosImportacion(
    lotes: LoteImportacion[],
    resumen: { enTransito: number; enAduana: number },
    reporte: ReporteImportaciones | null,
    stock: number
  ): EstadoImportacion[] {
    const countByEstado = (estado: LoteImportacion['estado']) =>
      lotes.filter((l) => l.estado === estado).reduce((sum, l) => sum + (l.cantidadVehiculos || 1), 0);

    const items: Omit<EstadoImportacion, 'pct'>[] = reporte?.pipeline?.length
      ? reporte.pipeline.slice(0, 5).map((p, i) => ({
          label: p.etiqueta,
          count: p.cantidad,
          color: ['#3366ff', '#ffaa00', '#a855f7', '#ff3d71', '#00d68f'][i % 5]
        }))
      : [
          { label: 'En Subasta', count: countByEstado('PLANIFICADO'), color: '#3366ff' },
          { label: 'Embarcados', count: countByEstado('EMBARCADO'), color: '#ffaa00' },
          { label: 'En Tránsito', count: countByEstado('EN_TRANSITO') || resumen.enTransito, color: '#a855f7' },
          { label: 'En Aduana', count: countByEstado('EN_ADUANA') || resumen.enAduana, color: '#ff3d71' },
          { label: 'En Lote', count: countByEstado('EN_PATIO') + countByEstado('LIBERADO') + stock, color: '#00d68f' }
        ];

    const max = Math.max(...items.map((i) => i.count), 1);
    return items.map((i) => ({ ...i, pct: Math.max(8, Math.round((i.count / max) * 100)) }));
  }

  private buildActividadFeed(pedidos: Pedido[], notifs: NotificacionItem[]): ActividadItem[] {
    const fromPedidos: ActividadItem[] = [...pedidos]
      .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
      .slice(0, 3)
      .map((p) => ({
        titulo:
          p.estado === 'ENTREGADO'
            ? `Venta completada - ${p.vehiculoTitulo || p.vehiculoDescripcion}`
            : `Pedido ${this.estadoLabel(p.estado)} - ${p.vehiculoTitulo || p.vehiculoDescripcion}`,
        subtitulo: p.clienteNombre,
        tiempo: this.tiempoRelativo(p.creadoEn),
        tone: this.tonoPorEstado(p.estado)
      }));

    const fromNotifs: ActividadItem[] = notifs.slice(0, 3).map((n) => ({
      titulo: n.mensaje,
      subtitulo: n.categoria.replace('_', ' '),
      tiempo: this.tiempoRelativo(n.creadoEn),
      tone: this.tonoPorNotif(n.nivel)
    }));

    const merged = [...fromNotifs, ...fromPedidos]
      .slice(0, 5);

    if (merged.length) return merged;

    return [
      {
        titulo: 'Venta completada - Toyota RAV4 2024',
        subtitulo: 'Carlos Martinez',
        tiempo: 'Hace 15 min',
        tone: 'green'
      },
      {
        titulo: 'Nuevo vehículo registrado - BMW X3 2024',
        subtitulo: 'Admin',
        tiempo: 'Hace 45 min',
        tone: 'blue'
      },
      {
        titulo: 'Inspección IA finalizada - Honda CR-V',
        subtitulo: 'Sistema',
        tiempo: 'Hace 1 hora',
        tone: 'purple'
      },
      {
        titulo: 'Embarque llegó a Puerto Cortés',
        subtitulo: 'MS-2',
        tiempo: 'Hace 2 horas',
        tone: 'amber'
      },
      {
        titulo: 'Cliente nuevo registrado - Ana Lopez',
        subtitulo: 'Vendedor 02',
        tiempo: 'Hace 3 horas',
        tone: 'cyan'
      }
    ];
  }

  private buildTopVendedores(
    reporte: ReporteResumen | null,
    ticketPromedio: number
  ): TopVendedorItem[] {
    const tones: TopVendedorItem['tone'][] = ['amber', 'blue', 'green', 'purple'];
    const lista = reporte?.topVendedores?.length ? reporte.topVendedores : this.topVendedoresDemo();

    return lista.slice(0, 4).map((v, i) => {
      const ventas = Math.max(1, Math.round(Number(v.ventasTotales) / Math.max(ticketPromedio, 28000)));
      return {
        rank: i + 1,
        nombre: v.nombreCompleto,
        ventasLabel: `${ventas} ventas`,
        montoLabel: this.formatMonto(Number(v.ventasTotales)),
        tone: tones[i % tones.length]
      };
    });
  }

  private buildAlertas(
    notifs: NotificacionItem[],
    reporte: ReporteImportaciones | null,
    vehiculos: { marca?: string; modelo?: string; estado: string }[],
    proximas: number
  ): string[] {
    const alertas: string[] = [];

    const stockBajo = vehiculos.filter((v) => v.estado === 'DISPONIBLE').length;
    if (stockBajo > 0 && stockBajo <= 5) {
      alertas.push(`Stock bajo: ${stockBajo} vehículos disponibles`);
    }

    reporte?.alertas?.slice(0, 2).forEach((a) => {
      alertas.push(`${a.codigo}: ${a.diasEnProceso} días en ${a.estado.replace('_', ' ')}`);
    });

    notifs
      .filter((n) => n.nivel === 'CRITICO' || n.nivel === 'ADVERTENCIA')
      .slice(0, 2)
      .forEach((n) => alertas.push(n.mensaje));

    if (proximas > 0) {
      alertas.push(`${proximas} vehículos con llegada próxima`);
    }

    if (!alertas.length) {
      return [
        'Stock bajo: Toyota RAV4 (2 uds)',
        'Póliza POL-2025-456 vence mañana',
        `${proximas || 5} vehículos llegando hoy`
      ];
    }

    return alertas.slice(0, 3);
  }

  private calcVariacionVentas(serie: { ventas: number; pedidos: number }[]): string {
    if (serie.length < 2) return '+18% vs anterior';
    const prev = serie[serie.length - 2]?.ventas || serie[serie.length - 2]?.pedidos || 0;
    const curr = serie[serie.length - 1]?.ventas || serie[serie.length - 1]?.pedidos || 0;
    if (!prev) return '+18% vs anterior';
    const pct = Math.round(((curr - prev) / prev) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}% vs anterior`;
  }

  private calcSatisfaccion(pedidos: Pedido[], reporte: ReporteResumen | null): number {
    const total = pedidos.length || reporte?.pedidosCompletados || 0;
    const ok = pedidos.filter((p) => p.estado === 'ENTREGADO').length || reporte?.pedidosCompletados || 0;
    if (!total) return 94;
    return Math.min(99, Math.max(75, Math.round((ok / total) * 100)));
  }

  private formatMonto(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${Math.round(value)}`;
  }

  private sumEntregados(pedidos: Pedido[]): number {
    return pedidos.filter((p) => p.estado === 'ENTREGADO').reduce((sum, p) => sum + p.total, 0);
  }

  private tiempoRelativo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs} hora${hrs > 1 ? 's' : ''}`;
    const days = Math.floor(hrs / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
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

  private tonoPorEstado(estado: string): ActividadItem['tone'] {
    const map: Record<string, ActividadItem['tone']> = {
      ENTREGADO: 'green',
      EN_IMPORTACION: 'blue',
      CONFIRMADO: 'amber',
      PENDIENTE: 'cyan',
      CANCELADO: 'purple'
    };
    return map[estado] ?? 'blue';
  }

  private tonoPorNotif(nivel: NivelNotificacion): ActividadItem['tone'] {
    const map: Record<NivelNotificacion, ActividadItem['tone']> = {
      EXITO: 'green',
      INFO: 'blue',
      ADVERTENCIA: 'amber',
      CRITICO: 'purple'
    };
    return map[nivel] ?? 'blue';
  }

  private serieDemo(): { mes: string; pedidos: number; ventas: number }[] {
    return [
      { mes: 'Ene', pedidos: 18, ventas: 620000 },
      { mes: 'Feb', pedidos: 22, ventas: 780000 },
      { mes: 'Mar', pedidos: 20, ventas: 710000 },
      { mes: 'Abr', pedidos: 26, ventas: 920000 },
      { mes: 'May', pedidos: 24, ventas: 860000 },
      { mes: 'Jun', pedidos: 30, ventas: 1100000 }
    ];
  }

  private topVendedoresDemo(): ReporteResumen['topVendedores'] {
    return [
      { codigo: 'V001', nombreCompleto: 'Roberto Hernandez', ventasTotales: 892000, comisionPorcentaje: 3 },
      { codigo: 'V002', nombreCompleto: 'Maria Gonzalez', ventasTotales: 745000, comisionPorcentaje: 3 },
      { codigo: 'V003', nombreCompleto: 'Juan Perez', ventasTotales: 622000, comisionPorcentaje: 2.5 },
      { codigo: 'V004', nombreCompleto: 'Ana Martinez', ventasTotales: 498000, comisionPorcentaje: 2.5 }
    ];
  }

  private applyDemoFallback(): void {
    this.kpiCards.set([
      { value: '152', label: 'Vehículos', hint: '+12 este mes', link: '/vehiculos', tone: 'blue' },
      { value: '$2.4M', label: 'Ventas Mes', hint: '+18% vs anterior', link: '/reportes', tone: 'green' },
      { value: '38', label: 'En Tránsito', hint: '5 llegando hoy', link: '/importaciones', tone: 'amber' },
      { value: '94%', label: 'Satisfacción', hint: '128 reseñas', tone: 'purple' }
    ]);
    this.barrasVentas.set(this.buildBarrasVentas(this.serieDemo()));
    this.estadosImportacion.set([
      { label: 'En Subasta', count: 12, color: '#3366ff', pct: 12 },
      { label: 'Embarcados', count: 8, color: '#ffaa00', pct: 8 },
      { label: 'En Tránsito', count: 15, color: '#a855f7', pct: 15 },
      { label: 'En Aduana', count: 5, color: '#ff3d71', pct: 5 },
      { label: 'En Lote', count: 98, color: '#00d68f', pct: 100 }
    ]);
    this.actividad.set(this.buildActividadFeed([], []));
    this.topVendedores.set(this.buildTopVendedores(null, 35000));
    this.alertas.set(['Stock bajo: Toyota RAV4 (2 uds)', 'Póliza POL-2025-456 vence mañana', '5 vehículos llegando hoy']);
  }
}
