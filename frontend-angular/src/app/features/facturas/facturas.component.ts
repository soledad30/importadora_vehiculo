import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbDialogService,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { ApiService } from '../../core/services/api.service';
import { FacturaPdfService } from '../../core/services/factura-pdf.service';
import { Factura, Pedido } from '../../core/models';
import { FacturaFormDialogComponent } from './factura-form-dialog.component';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    NbCardModule,
    NbButtonModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule
  ],
  templateUrl: './facturas.component.html',
  styleUrl: './facturas.component.scss'
})
export class FacturasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(NbDialogService);
  private readonly pdf = inject(FacturaPdfService);

  readonly items = signal<Factura[]>([]);
  readonly pedidos = signal<Pedido[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly exportingId = signal<number | null>(null);

  readonly stats = computed(() => {
    const all = this.items();
    return {
      total: all.length,
      borrador: all.filter((f) => f.estado === 'BORRADOR').length,
      emitidas: all.filter((f) => f.estado === 'EMITIDA').length,
      pagadas: all.filter((f) => f.estado === 'PAGADA').length
    };
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ facturas: this.api.getFacturas(), pedidos: this.api.getPedidos() }).subscribe({
      next: ({ facturas, pedidos }) => {
        this.items.set(facturas);
        this.pedidos.set(
          pedidos.filter((p) => p.estado !== 'PENDIENTE' && p.estado !== 'CANCELADO')
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudieron cargar las facturas');
      }
    });
  }

  openCreate(): void {
    const pedidosConFactura = new Set(this.items().map((f) => f.pedidoId));
    const pedidosDisponibles = this.pedidos().filter((p) => !pedidosConFactura.has(p.id));
    if (!pedidosDisponibles.length) {
      this.error.set('No hay pedidos sin factura. Todos los pedidos activos ya están facturados.');
      return;
    }
    this.dialog
      .open(FacturaFormDialogComponent, {
        context: { pedidos: pedidosDisponibles },
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.load();
      });
  }

  emitir(id: number): void {
    this.error.set(null);
    this.api.emitirFactura(id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.detail ?? 'Error al emitir factura')
    });
  }

  marcarPagada(id: number): void {
    this.error.set(null);
    this.api.marcarFacturaPagada(id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.detail ?? 'Error al marcar factura como pagada')
    });
  }

  pedidoCodigo(factura: Factura): string {
    if (factura.pedidoCodigo) return `#${factura.pedidoCodigo}`;
    const pedido = this.pedidos().find((p) => p.id === factura.pedidoId);
    if (pedido?.codigo) return `#${pedido.codigo}`;
    return `#PED-${String(factura.pedidoId).padStart(3, '0')}`;
  }

  exportarPdf(factura: Factura): void {
    this.exportingId.set(factura.id);
    this.error.set(null);
    this.api.getFactura(factura.id).subscribe({
      next: (detalle) => {
        this.pdf.exportar(detalle);
        this.exportingId.set(null);
      },
      error: (err) => {
        this.exportingId.set(null);
        this.error.set(err?.error?.detail ?? 'No se pudo generar el PDF');
      }
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      BORRADOR: 'estado-borrador',
      EMITIDA: 'estado-emitida',
      PAGADA: 'estado-pagada',
      ANULADA: 'estado-anulada'
    };
    return map[estado] ?? 'estado-borrador';
  }
}
