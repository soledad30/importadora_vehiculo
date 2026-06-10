import { CurrencyPipe, KeyValuePipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ReporteFinanzas,
  ReporteImportaciones,
  ReporteResumen
} from '../../core/models';
import { ReporteDocumentos, ReporteInspeccion } from '../../core/models/ms-extensions';
import { ApiService } from '../../core/services/api.service';
import { Ms3Service } from '../../core/services/ms3.service';
import { ReporteExportService } from '../../core/services/reporte-export.service';
import {
  fechaReporte,
  fmtUsd,
  insightsDocumentos,
  insightsEjecutivo,
  insightsFinanzas,
  insightsImportaciones,
  insightsInspeccion,
  tabLabel
} from '../../core/utils/reporte-insights.util';

type TabReporte = 'ejecutivo' | 'importaciones' | 'documentos' | 'finanzas' | 'inspeccion';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CurrencyPipe,
    KeyValuePipe,
    PercentPipe,
    NbCardModule,
    NbButtonModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ms3 = inject(Ms3Service);
  private readonly exportSvc = inject(ReporteExportService);

  readonly tab = signal<TabReporte>('ejecutivo');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly generadoEn = signal(fechaReporte());

  readonly resumen = signal<ReporteResumen | null>(null);
  readonly importaciones = signal<ReporteImportaciones | null>(null);
  readonly finanzas = signal<ReporteFinanzas | null>(null);
  readonly documentos = signal<ReporteDocumentos | null>(null);
  readonly inspeccion = signal<ReporteInspeccion | null>(null);

  readonly tabs: { id: TabReporte; label: string; icon: string }[] = [
    { id: 'ejecutivo', label: 'Ejecutivo', icon: 'bar-chart-outline' },
    { id: 'importaciones', label: 'Importaciones', icon: 'globe-outline' },
    { id: 'documentos', label: 'Documentos', icon: 'file-text-outline' },
    { id: 'finanzas', label: 'Finanzas', icon: 'credit-card-outline' },
    { id: 'inspeccion', label: 'Inspección IA', icon: 'eye-outline' }
  ];

  readonly insightsActuales = computed(() => {
    switch (this.tab()) {
      case 'ejecutivo':
        return insightsEjecutivo(this.resumen());
      case 'importaciones':
        return insightsImportaciones(this.importaciones());
      case 'finanzas':
        return insightsFinanzas(this.finanzas());
      case 'documentos':
        return insightsDocumentos(this.documentos());
      case 'inspeccion':
        return insightsInspeccion(this.inspeccion());
      default:
        return [];
    }
  });

  ngOnInit(): void {
    this.load();
  }

  setTab(id: TabReporte): void {
    this.tab.set(id);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      resumen: this.api.getReporteResumen().pipe(catchError(() => of(null))),
      importaciones: this.api.getReporteImportaciones().pipe(catchError(() => of(null))),
      finanzas: this.api.getReporteFinanzas().pipe(catchError(() => of(null))),
      documentos: this.ms3.getReporteDocumentos().pipe(catchError(() => of(null))),
      inspeccion: this.ms3.getReporteInspeccion().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ resumen, importaciones, finanzas, documentos, inspeccion }) => {
        this.resumen.set(resumen);
        this.importaciones.set(importaciones);
        this.finanzas.set(finanzas);
        this.documentos.set(documentos);
        this.inspeccion.set(inspeccion);
        this.generadoEn.set(fechaReporte());
        this.loading.set(false);
        if (!resumen && !importaciones && !finanzas && !documentos && !inspeccion) {
          this.error.set('No se pudieron cargar los reportes');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los reportes');
      }
    });
  }

  exportar(formato: 'pdf' | 'excel' | 'word'): void {
    const tab = this.tab();
    this.exportSvc.exportar(
      {
        tab,
        tabLabel: tabLabel(tab),
        resumen: this.resumen(),
        importaciones: this.importaciones(),
        finanzas: this.finanzas(),
        documentos: this.documentos(),
        inspeccion: this.inspeccion()
      },
      formato
    );
  }

  formatCompact(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${Math.round(value)}`;
  }

  fmtUsd = fmtUsd;

  totalPedidos(r: ReporteResumen): number {
    return r.pedidosPendientes + r.pedidosEnProceso + r.pedidosCompletados;
  }

  tasaCierre(r: ReporteResumen): number {
    const t = this.totalPedidos(r);
    return t ? r.pedidosCompletados / t : 0;
  }

  ticketPromedio(r: ReporteResumen): number {
    return r.pedidosCompletados ? r.ventasTotales / r.pedidosCompletados : 0;
  }

  comisionEstimada(vendedor: ReporteResumen['topVendedores'][0]): number {
    return (vendedor.ventasTotales * vendedor.comisionPorcentaje) / 100;
  }

  participacionVenta(vendedor: ReporteResumen['topVendedores'][0], r: ReporteResumen): number {
    return r.ventasTotales ? vendedor.ventasTotales / r.ventasTotales : 0;
  }

  tasaCobranza(fin: ReporteFinanzas): number {
    return fin.montoTotalFacturado ? fin.montoCobrado / fin.montoTotalFacturado : 0;
  }

  facturasVencidas30(fin: ReporteFinanzas): number {
    return fin.pendientesCobro.filter((p) => p.diasDesdeEmision > 30).length;
  }

  promedioDiasPendientes(fin: ReporteFinanzas): number {
    if (!fin.pendientesCobro.length) return 0;
    const sum = fin.pendientesCobro.reduce((acc, p) => acc + p.diasDesdeEmision, 0);
    return Math.round(sum / fin.pendientesCobro.length);
  }

  pipelinePct(cantidad: number, total: number): number {
    if (!total) return 0;
    return Math.round((cantidad / total) * 100);
  }

  pipelineTotal(imp: ReporteImportaciones): number {
    return imp.pipeline.reduce((acc, p) => acc + p.cantidad, 0);
  }

  cuelloBotella(imp: ReporteImportaciones): string {
    const top = [...imp.pipeline].sort((a, b) => b.cantidad - a.cantidad)[0];
    return top ? `${top.etiqueta} (${top.cantidad})` : '—';
  }

  estadoImportacionLabel(estado: string): string {
    const map: Record<string, string> = {
      SOLICITADA: 'Solicitada',
      EN_TRANSITO: 'En tránsito',
      EN_ADUANA: 'En aduana',
      LIBERADA: 'Liberada',
      COMPLETADA: 'Completada'
    };
    return map[estado] ?? estado;
  }
}
