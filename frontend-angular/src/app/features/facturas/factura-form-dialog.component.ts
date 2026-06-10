import { CurrencyPipe } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbDialogModule,
  NbDialogRef,
  NbInputModule,
  NbOptionModule,
  NbSelectModule,
  NbSpinnerModule
} from '@nebular/theme';
import { ApiService } from '../../core/services/api.service';
import { Pedido } from '../../core/models';

const CAI_DEMO = 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';
const RTN_EMISOR_DEMO = '0801-1990-123456';
const TASA_ISV = 0.15;

@Component({
  selector: 'app-factura-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    NbDialogModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    NbAlertModule,
    NbSpinnerModule
  ],
  templateUrl: './factura-form-dialog.component.html',
  styleUrl: './factura-form-dialog.component.scss'
})
export class FacturaFormDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<FacturaFormDialogComponent>);

  @Input() pedidos: Pedido[] = [];

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly pedidoSeleccionado = signal<Pedido | null>(null);
  readonly siguienteNumero = signal('FAC-0000-0000');

  readonly metodosPago = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE'] as const;

  readonly form = this.fb.group({
    pedidoId: [null as number | null, Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    subtotal: [0, [Validators.required, Validators.min(0.01)]],
    isv: [0, [Validators.required, Validators.min(0)]],
    cai: [CAI_DEMO, Validators.required],
    rtnEmisor: [RTN_EMISOR_DEMO, Validators.required],
    rtnCliente: ['', Validators.required],
    metodoPago: ['TRANSFERENCIA' as const, Validators.required]
  });

  ngOnInit(): void {
    this.api.getSiguienteNumeroFactura().subscribe({
      next: (numero) => this.siguienteNumero.set(numero),
      error: () => this.siguienteNumero.set('Se asignara al guardar')
    });
  }

  pedidoCodigo(p: Pedido): string {
    return p.codigo ? `#${p.codigo}` : `#PED-${String(p.id).padStart(3, '0')}`;
  }

  onPedidoChange(pedidoId: number): void {
    const pedido = this.pedidos.find((p) => p.id === pedidoId) ?? null;
    this.pedidoSeleccionado.set(pedido);
    if (pedido) {
      const subtotal = +(pedido.total / (1 + TASA_ISV)).toFixed(2);
      const isv = +(pedido.total - subtotal).toFixed(2);
      this.form.patchValue({
        monto: pedido.total,
        subtotal,
        isv,
        rtnCliente: pedido.clienteNumeroDocumento ?? ''
      });
    }
  }

  recalcularIsv(): void {
    const subtotal = this.form.controls.subtotal.value ?? 0;
    if (subtotal > 0) {
      const isv = +(subtotal * TASA_ISV).toFixed(2);
      this.form.patchValue({ isv, monto: +(subtotal + isv).toFixed(2) });
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (!this.form.controls.pedidoId.value) {
        this.error.set('Seleccione un pedido');
      } else if (!this.form.controls.rtnCliente.value?.trim()) {
        this.error.set('Indique el RTN o documento del cliente (cédula / RTN)');
      } else {
        this.error.set('Revise los campos obligatorios del formulario');
      }
      return;
    }
    const raw = this.form.getRawValue();
    if (!raw.pedidoId) {
      this.error.set('Seleccione un pedido');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.api
      .createFactura({
        pedidoId: raw.pedidoId,
        monto: raw.monto ?? 0,
        subtotal: raw.subtotal ?? undefined,
        isv: raw.isv ?? undefined,
        cai: raw.cai ?? undefined,
        rtnEmisor: raw.rtnEmisor ?? undefined,
        rtnCliente: raw.rtnCliente?.trim() || undefined,
        metodoPago: raw.metodoPago ?? undefined
      })
      .subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(
          err?.error?.detail ??
            err?.error?.message ??
            err?.message ??
            'Error al crear la factura'
        );
      }
    });
  }
}
