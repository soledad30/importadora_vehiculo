import { ReporteFinanzas, ReporteImportaciones, ReporteResumen } from '../models';
import { ReporteDocumentos, ReporteInspeccion } from '../models/ms-extensions';

export type TabReporteExport =
  | 'ejecutivo'
  | 'importaciones'
  | 'documentos'
  | 'finanzas'
  | 'inspeccion';

export interface ReporteExportContext {
  tab: TabReporteExport;
  tabLabel: string;
  resumen: ReporteResumen | null;
  importaciones: ReporteImportaciones | null;
  finanzas: ReporteFinanzas | null;
  documentos: ReporteDocumentos | null;
  inspeccion: ReporteInspeccion | null;
}

export function fmtUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

export function fmtPct(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

export function fechaReporte(): string {
  return new Date().toLocaleString('es-NI', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function insightsEjecutivo(r: ReporteResumen | null): string[] {
  if (!r) return [];
  const totalPedidos = r.pedidosPendientes + r.pedidosEnProceso + r.pedidosCompletados;
  const tasaConversion = totalPedidos ? (r.pedidosCompletados / totalPedidos) * 100 : 0;
  const ticketPromedio = r.pedidosCompletados ? r.ventasTotales / r.pedidosCompletados : 0;
  const participacionMes = r.ventasTotales ? (r.ventasMesActual / r.ventasTotales) * 100 : 0;
  const comisionEstimada = r.topVendedores.reduce(
    (acc, v) => acc + (v.ventasTotales * v.comisionPorcentaje) / 100,
    0
  );
  const insights = [
    `Tasa de cierre: ${fmtPct(tasaConversion)} (${r.pedidosCompletados} de ${totalPedidos} pedidos).`,
    `Ticket promedio entregado: ${fmtUsd(ticketPromedio)}.`,
    `Ventas del mes representan ${fmtPct(participacionMes)} del acumulado histórico.`,
    `Comisión estimada sobre ventas cerradas: ${fmtUsd(comisionEstimada)}.`
  ];
  if (r.pedidosPendientes >= 3) {
    insights.push(`Hay ${r.pedidosPendientes} pedidos pendientes: priorice confirmación y asignación de vendedor.`);
  }
  if (r.importacionesActivas === 0 && r.pedidosEnProceso > 0) {
    insights.push('Pedidos en proceso sin importación activa: revisar embarques en MS-2/Importaciones.');
  }
  if (r.vehiculosDisponibles <= 1) {
    insights.push('Stock bajo: evalúe nueva compra según predicción ML y pedidos confirmados.');
  }
  return insights;
}

export function insightsImportaciones(imp: ReporteImportaciones | null): string[] {
  if (!imp) return [];
  const total = imp.pipeline.reduce((a, p) => a + p.cantidad, 0);
  const cuello = [...imp.pipeline].sort((a, b) => b.cantidad - a.cantidad)[0];
  const insights = [
    `${imp.totalActivas} importaciones activas; ${imp.totalCompletadas} completadas históricamente.`,
    `Tiempo promedio en pipeline: ${imp.promedioDiasEnProceso} días.`,
    `Cuello de botella: ${cuello?.etiqueta ?? '—'} con ${cuello?.cantidad ?? 0} unidades (${total ? fmtPct((cuello?.cantidad ?? 0) / total * 100) : '0%'}).`
  ];
  if (imp.pedidosConfirmadosSinImportacion > 0) {
    insights.push(
      `${imp.pedidosConfirmadosSinImportacion} pedido(s) confirmado(s) sin importación iniciada — riesgo de retraso en entrega.`
    );
  }
  if (imp.importacionesRetrasadas > 0) {
    insights.push(`${imp.importacionesRetrasadas} importación(es) superaron la ETA: escalar con naviera/aduana.`);
  }
  return insights;
}

export function insightsFinanzas(fin: ReporteFinanzas | null): string[] {
  if (!fin) return [];
  const tasaCobranza = fin.montoTotalFacturado
    ? (fin.montoCobrado / fin.montoTotalFacturado) * 100
    : 0;
  const vencidas = fin.pendientesCobro.filter((p) => p.diasDesdeEmision > 30).length;
  const insights = [
    `Tasa de cobranza: ${fmtPct(tasaCobranza)} (${fmtUsd(fin.montoCobrado)} cobrado de ${fmtUsd(fin.montoTotalFacturado)}).`,
    `Saldo por cobrar: ${fmtUsd(fin.montoPorCobrar)} en ${fin.facturasEmitidas} factura(s) emitida(s).`
  ];
  if (vencidas > 0) {
    insights.push(`${vencidas} factura(s) con más de 30 días: activar gestión de cobranza.`);
  }
  if (fin.montoPorCobrar > fin.montoCobrado && fin.montoCobrado > 0) {
    insights.push('El pendiente supera lo cobrado: monitorear flujo de caja semanal.');
  }
  return insights;
}

export function insightsDocumentos(doc: ReporteDocumentos | null): string[] {
  if (!doc) return [];
  const insights = [
    `Cumplimiento documental: ${doc.completitudPct}% verificado (${doc.verificados}/${doc.total}).`,
    `${doc.sinArchivo} documento(s) sin archivo en S3 — bloquean trazabilidad y auditoría.`
  ];
  const tiposRiesgo = doc.porTipo.filter((t) => t.sinArchivo > 0 || t.verificados < t.total);
  if (tiposRiesgo.length) {
    insights.push(
      `Tipos con brecha: ${tiposRiesgo.map((t) => t.nombre).join(', ')}.`
    );
  }
  if (doc.pendientes + doc.enRevision > 0) {
    insights.push(`${doc.pendientes + doc.enRevision} en OCR/revisión: asignar validación manual esta semana.`);
  }
  return insights;
}

export function insightsInspeccion(ins: ReporteInspeccion | null): string[] {
  if (!ins) return [];
  const tasaDanos = ins.totalInspecciones ? (ins.conDanos / ins.totalInspecciones) * 100 : 0;
  const costoProm = ins.conDanos ? ins.costoReparacionEstimado / ins.conDanos : 0;
  const insights = [
    `${fmtPct(tasaDanos)} de inspecciones detectaron daños (${ins.conDanos}/${ins.totalInspecciones}).`,
    `Costo estimado acumulado de reparación: ${fmtUsd(ins.costoReparacionEstimado)} (prom. ${fmtUsd(costoProm)} por unidad dañada).`
  ];
  if (ins.conDanos > 0) {
    insights.push('Negociar descuento con proveedor/subasta en unidades con daños moderados o graves.');
  }
  return insights;
}

export function insightsForTab(ctx: ReporteExportContext): string[] {
  switch (ctx.tab) {
    case 'ejecutivo':
      return insightsEjecutivo(ctx.resumen);
    case 'importaciones':
      return insightsImportaciones(ctx.importaciones);
    case 'finanzas':
      return insightsFinanzas(ctx.finanzas);
    case 'documentos':
      return insightsDocumentos(ctx.documentos);
    case 'inspeccion':
      return insightsInspeccion(ctx.inspeccion);
    default:
      return [];
  }
}

export function tabLabel(id: TabReporteExport): string {
  const map: Record<TabReporteExport, string> = {
    ejecutivo: 'Ejecutivo',
    importaciones: 'Importaciones',
    documentos: 'Documentos',
    finanzas: 'Finanzas',
    inspeccion: 'Inspección IA'
  };
  return map[id];
}
