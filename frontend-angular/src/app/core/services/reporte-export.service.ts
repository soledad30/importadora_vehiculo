import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  fechaReporte,
  fmtUsd,
  insightsForTab,
  ReporteExportContext,
  tabLabel
} from '../utils/reporte-insights.util';

type FormatoExport = 'pdf' | 'excel' | 'word';

@Injectable({ providedIn: 'root' })
export class ReporteExportService {
  exportar(ctx: ReporteExportContext, formato: FormatoExport): void {
    const rows = this.buildRows(ctx);
    const insights = insightsForTab(ctx);
    const titulo = `Reporte ${ctx.tabLabel} — Importadora de Vehículos`;
    const slug = ctx.tab;
    const stamp = new Date().toISOString().slice(0, 10);

    if (formato === 'pdf') {
      this.exportPdf(titulo, rows, insights, `${slug}-${stamp}.pdf`);
      return;
    }
    if (formato === 'excel') {
      this.exportExcelHtml(titulo, rows, insights, `${slug}-${stamp}.xls`);
      return;
    }
    this.exportWordHtml(titulo, rows, insights, `${slug}-${stamp}.doc`);
  }

  private buildRows(ctx: ReporteExportContext): { seccion: string; headers: string[]; filas: string[][] }[] {
    const sections: { seccion: string; headers: string[]; filas: string[][] }[] = [];

    switch (ctx.tab) {
      case 'ejecutivo': {
        const r = ctx.resumen;
        if (!r) break;
        const totalPed = r.pedidosPendientes + r.pedidosEnProceso + r.pedidosCompletados;
        sections.push({
          seccion: 'Indicadores clave',
          headers: ['Indicador', 'Valor'],
          filas: [
            ['Ventas totales', fmtUsd(r.ventasTotales)],
            ['Ventas del mes', fmtUsd(r.ventasMesActual)],
            ['Pedidos pendientes', String(r.pedidosPendientes)],
            ['Pedidos en proceso', String(r.pedidosEnProceso)],
            ['Pedidos completados', String(r.pedidosCompletados)],
            ['Tasa de cierre', totalPed ? `${Math.round((r.pedidosCompletados / totalPed) * 1000) / 10}%` : '0%'],
            [
              'Ticket promedio',
              r.pedidosCompletados ? fmtUsd(r.ventasTotales / r.pedidosCompletados) : '$0'
            ],
            ['Importaciones activas', String(r.importacionesActivas)],
            ['Facturas emitidas', String(r.facturasEmitidas)],
            ['Vehículos disponibles', String(r.vehiculosDisponibles)],
            ['Vehículos vendidos', String(r.vehiculosVendidos)],
            ['Clientes activos', String(r.clientesActivos)]
          ]
        });
        if (r.topVendedores.length) {
          sections.push({
            seccion: 'Top vendedores',
            headers: ['Código', 'Nombre', 'Ventas', 'Comisión %', 'Comisión USD'],
            filas: r.topVendedores.map((v) => [
              v.codigo,
              v.nombreCompleto,
              fmtUsd(v.ventasTotales),
              `${v.comisionPorcentaje}%`,
              fmtUsd((v.ventasTotales * v.comisionPorcentaje) / 100)
            ])
          });
        }
        break;
      }
      case 'importaciones': {
        const imp = ctx.importaciones;
        if (!imp) break;
        sections.push({
          seccion: 'Resumen logístico',
          headers: ['Indicador', 'Valor'],
          filas: [
            ['Importaciones activas', String(imp.totalActivas)],
            ['Completadas', String(imp.totalCompletadas)],
            ['Pedidos sin importación', String(imp.pedidosConfirmadosSinImportacion)],
            ['Retrasadas (ETA vencida)', String(imp.importacionesRetrasadas)],
            ['Días promedio en proceso', String(imp.promedioDiasEnProceso)]
          ]
        });
        sections.push({
          seccion: 'Pipeline',
          headers: ['Etapa', 'Cantidad'],
          filas: imp.pipeline.map((p) => [p.etiqueta, String(p.cantidad)])
        });
        if (imp.alertas.length) {
          sections.push({
            seccion: 'Alertas ETA',
            headers: ['Código', 'Vehículo', 'Cliente', 'Estado', 'Días', 'ETA', 'Puerto'],
            filas: imp.alertas.map((a) => [
              a.codigo,
              a.vehiculo,
              a.cliente,
              a.estado,
              String(a.diasEnProceso),
              a.fechaEstimadaEntrega,
              a.puertoDestino
            ])
          });
        }
        break;
      }
      case 'finanzas': {
        const fin = ctx.finanzas;
        if (!fin) break;
        const tasa = fin.montoTotalFacturado
          ? `${Math.round((fin.montoCobrado / fin.montoTotalFacturado) * 1000) / 10}%`
          : '0%';
        sections.push({
          seccion: 'Resumen financiero',
          headers: ['Indicador', 'Valor'],
          filas: [
            ['Por cobrar', fmtUsd(fin.montoPorCobrar)],
            ['Cobrado', fmtUsd(fin.montoCobrado)],
            ['Total facturado', fmtUsd(fin.montoTotalFacturado)],
            ['Tasa de cobranza', tasa],
            ['Facturas emitidas', String(fin.facturasEmitidas)],
            ['Facturas pagadas', String(fin.facturasPagadas)],
            ['Borrador', String(fin.facturasBorrador)],
            ['Anuladas', String(fin.facturasAnuladas)]
          ]
        });
        if (fin.pendientesCobro.length) {
          sections.push({
            seccion: 'Cuentas por cobrar',
            headers: ['Factura', 'Cliente', 'Vehículo', 'Monto', 'Emisión', 'Antigüedad'],
            filas: fin.pendientesCobro.map((f) => [
              f.numeroFactura,
              f.cliente,
              f.vehiculo,
              fmtUsd(f.monto),
              f.fechaEmision,
              `${f.diasDesdeEmision} días`
            ])
          });
        }
        break;
      }
      case 'documentos': {
        const doc = ctx.documentos;
        if (!doc) break;
        sections.push({
          seccion: 'Cumplimiento documental',
          headers: ['Indicador', 'Valor'],
          filas: [
            ['Total', String(doc.total)],
            ['Verificados', String(doc.verificados)],
            ['En revisión', String(doc.enRevision)],
            ['Pendientes', String(doc.pendientes)],
            ['Sin archivo', String(doc.sinArchivo)],
            ['Completitud', `${doc.completitudPct}%`]
          ]
        });
        sections.push({
          seccion: 'Por tipo',
          headers: ['Tipo', 'Total', 'Verificados', 'Sin archivo'],
          filas: doc.porTipo.map((t) => [
            t.nombre,
            String(t.total),
            String(t.verificados),
            String(t.sinArchivo)
          ])
        });
        break;
      }
      case 'inspeccion': {
        const ins = ctx.inspeccion;
        if (!ins) break;
        sections.push({
          seccion: 'Calidad e inspección IA',
          headers: ['Indicador', 'Valor'],
          filas: [
            ['Total inspecciones', String(ins.totalInspecciones)],
            ['Con daños', String(ins.conDanos)],
            ['Sin daños', String(ins.sinDanos)],
            ['Costo reparación est.', fmtUsd(ins.costoReparacionEstimado)]
          ]
        });
        const sev = Object.entries(ins.porSeveridad);
        if (sev.length) {
          sections.push({ seccion: 'Por severidad', headers: ['Severidad', 'Cantidad'], filas: sev.map(([k, v]) => [k, String(v)]) });
        }
        if (ins.ultimasInspecciones.length) {
          sections.push({
            seccion: 'Últimas inspecciones',
            headers: ['Vehículo', 'VIN', 'Fecha', 'Resultado', 'Daños', 'Costo', 'Severidad'],
            filas: ins.ultimasInspecciones.map((u) => [
              u.vehiculo,
              u.vin,
              u.fecha,
              u.resultado,
              String(u.danosDetectados),
              fmtUsd(u.costoReparacion),
              u.severidad
            ])
          });
        }
        break;
      }
    }
    return sections;
  }

  private exportPdf(
    titulo: string,
    sections: { seccion: string; headers: string[]; filas: string[][] }[],
    insights: string[],
    filename: string
  ): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 14;
    let y = margin;

    doc.setFillColor(51, 102, 255);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Importadora de Vehículos S.A.', margin, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(titulo, margin, 20);
    doc.text(`Generado: ${fechaReporte()}`, margin, 26);

    y = 36;
    doc.setTextColor(34, 43, 69);
    if (insights.length) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Análisis para decisiones', margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      for (const line of insights) {
        const lines = doc.splitTextToSize(`• ${line}`, doc.internal.pageSize.getWidth() - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 4.5 + 1;
      }
      y += 4;
    }

    for (const section of sections) {
      if (y > 250) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 102, 255);
      doc.text(section.seccion, margin, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [section.headers],
        body: section.filas,
        theme: 'grid',
        headStyles: { fillColor: [51, 102, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        styles: { overflow: 'linebreak' }
      });
      y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
      y += 8;
    }

    doc.save(filename);
  }

  private exportExcelHtml(
    titulo: string,
    sections: { seccion: string; headers: string[]; filas: string[][] }[],
    insights: string[],
    filename: string
  ): void {
    const html = this.buildHtmlTable(titulo, sections, insights);
    this.downloadBlob(
      `\ufeff${html}`,
      'application/vnd.ms-excel;charset=utf-8',
      filename
    );
  }

  private exportWordHtml(
    titulo: string,
    sections: { seccion: string; headers: string[]; filas: string[][] }[],
    insights: string[],
    filename: string
  ): void {
    const html = this.buildHtmlTable(titulo, sections, insights);
    this.downloadBlob(html, 'application/msword;charset=utf-8', filename);
  }

  private buildHtmlTable(
    titulo: string,
    sections: { seccion: string; headers: string[]; filas: string[][] }[],
    insights: string[]
  ): string {
    const insightHtml = insights.length
      ? `<h3>Análisis para decisiones</h3><ul>${insights.map((i) => `<li>${this.escape(i)}</li>`).join('')}</ul>`
      : '';

    const sectionsHtml = sections
      .map((s) => {
        const head = `<tr>${s.headers.map((h) => `<th>${this.escape(h)}</th>`).join('')}</tr>`;
        const body = s.filas
          .map(
            (row) =>
              `<tr>${row.map((c) => `<td>${this.escape(c)}</td>`).join('')}</tr>`
          )
          .join('');
        return `<h3>${this.escape(s.seccion)}</h3><table border="1" cellpadding="4">${head}${body}</table>`;
      })
      .join('<br/>');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${this.escape(titulo)}</title></head><body>
<h1>${this.escape(titulo)}</h1>
<p><em>Generado: ${this.escape(fechaReporte())}</em></p>
${insightHtml}
${sectionsHtml}
</body></html>`;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private downloadBlob(content: string, mime: string, filename: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export { tabLabel };
