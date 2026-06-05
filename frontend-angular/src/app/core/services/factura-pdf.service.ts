import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Factura } from '../models';

const EMPRESA = {
  nombre: 'Importadora de Vehiculos S.A.',
  ruc: 'J-12345678-9',
  direccion: 'Km 8.5 Carretera Masaya, Managua, Nicaragua',
  telefono: '+505 2222-0000',
  email: 'facturacion@importadoravehiculos.com',
  web: 'www.importadoravehiculos.com'
};

@Injectable({ providedIn: 'root' })
export class FacturaPdfService {
  exportar(factura: Factura): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = margin;

    // Encabezado corporativo
    doc.setFillColor(51, 102, 255);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(EMPRESA.nombre, margin, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${EMPRESA.direccion}  |  Tel: ${EMPRESA.telefono}`, margin, 23);
    doc.text(`RUC: ${EMPRESA.ruc}  |  ${EMPRESA.email}`, margin, 29);
    doc.text(EMPRESA.web, margin, 35);

    // Bloque factura
    y = 48;
    doc.setTextColor(34, 43, 69);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA DE VENTA', margin, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const metaX = pageW - margin;
    y += 8;
    doc.text(`No. ${factura.numeroFactura}`, metaX, y, { align: 'right' });
    y += 5;
    doc.text(`Fecha: ${this.fmtFecha(factura.fechaEmision)}`, metaX, y, { align: 'right' });
    y += 5;
    doc.text(`Pedido: ${factura.pedidoCodigo ?? `#PED-${factura.pedidoId}`}`, metaX, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.estadoColor(factura.estado));
    doc.text(`Estado: ${factura.estado}`, metaX, y, { align: 'right' });
    doc.setTextColor(34, 43, 69);

    y += 12;
    y = this.drawSection(doc, margin, y, pageW - margin * 2, 'DATOS DEL CLIENTE', [
      ['Nombre', factura.clienteNombre ?? '—'],
      ['Documento', factura.clienteDocumento ?? '—'],
      ['Correo', factura.clienteEmail ?? '—'],
      ['Telefono', factura.clienteTelefono ?? '—'],
      ['Direccion', this.joinCiudad(factura.clienteDireccion, factura.clienteCiudad)]
    ]);

    y = this.drawSection(doc, margin, y, pageW - margin * 2, 'VENDEDOR ASIGNADO', [
      ['Nombre', factura.vendedorNombre ?? 'Sin asignar'],
      ['Codigo', factura.vendedorCodigo ?? '—'],
      ['Telefono', factura.vendedorTelefono ?? '—'],
      ['Correo', factura.vendedorEmail ?? '—']
    ]);

    y += 4;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 255);
    doc.text('DETALLE DE VEHICULO(S)', margin, y);
    y += 4;

    const descripcion = [
      factura.vehiculoTitulo ?? 'Vehiculo importado',
      factura.vehiculoVin ? `VIN: ${factura.vehiculoVin}` : null,
      factura.vehiculoColor ? `Color: ${factura.vehiculoColor}` : null,
      factura.vehiculoPaisOrigen ? `Origen: ${factura.vehiculoPaisOrigen}` : null
    ]
      .filter(Boolean)
      .join('\n');

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Descripcion del vehiculo', 'Cant.', 'Precio base', 'Impuestos', 'Envio', 'Subtotal']],
      body: [
        [
          '1',
          descripcion,
          '1',
          this.fmtUsd(factura.precioBase ?? factura.monto),
          this.fmtUsd(factura.impuestos ?? 0),
          this.fmtUsd(factura.envio ?? 0),
          this.fmtUsd(factura.total ?? factura.monto)
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [51, 102, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: { fontSize: 8, textColor: [34, 43, 69] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 62 },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 24, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
      }
    });

    const tableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30;
    y = tableEnd + 8;

    const totalX = pageW - margin;
    doc.setFillColor(245, 247, 252);
    doc.roundedRect(pageW - margin - 72, y - 6, 72, 28, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 90, 110);
    doc.text('Precio base:', totalX - 68, y);
    doc.text(this.fmtUsd(factura.precioBase ?? factura.monto), totalX, y, { align: 'right' });
    y += 6;
    doc.text('Impuestos importacion:', totalX - 68, y);
    doc.text(this.fmtUsd(factura.impuestos ?? 0), totalX, y, { align: 'right' });
    y += 6;
    doc.text('Costo logistica / envio:', totalX - 68, y);
    doc.text(this.fmtUsd(factura.envio ?? 0), totalX, y, { align: 'right' });
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(51, 102, 255);
    doc.text('TOTAL A PAGAR:', totalX - 68, y);
    doc.text(this.fmtUsd(factura.total ?? factura.monto), totalX, y, { align: 'right' });

    y += 16;
    doc.setDrawColor(200, 210, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 130, 150);
    doc.text(
      'Documento generado electronicamente por el sistema Importadora de Vehiculos. ' +
        'Los montos estan expresados en dolares estadounidenses (USD). ' +
        'Gracias por su preferencia.',
      margin,
      y,
      { maxWidth: pageW - margin * 2 }
    );

    doc.save(`${factura.numeroFactura}.pdf`);
  }

  private drawSection(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    title: string,
    rows: [string, string][]
  ): number {
    doc.setFillColor(245, 247, 252);
    doc.roundedRect(x, y, width, 6 + rows.length * 5.5, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 255);
    doc.text(title, x + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 70, 90);
    let rowY = y + 11;
    for (const [label, value] of rows) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, x + 4, rowY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, x + 32, rowY, { maxWidth: width - 36 });
      rowY += 5.5;
    }
    return rowY + 4;
  }

  private fmtUsd(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value ?? 0);
  }

  private fmtFecha(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-NI', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private joinCiudad(direccion?: string, ciudad?: string): string {
    if (direccion && ciudad) return `${direccion}, ${ciudad}`;
    return direccion ?? ciudad ?? '—';
  }

  private estadoColor(estado: string): [number, number, number] {
    const map: Record<string, [number, number, number]> = {
      BORRADOR: [255, 170, 0],
      EMITIDA: [51, 102, 255],
      PAGADA: [0, 214, 143],
      ANULADA: [255, 61, 113]
    };
    return map[estado] ?? [80, 90, 110];
  }
}
