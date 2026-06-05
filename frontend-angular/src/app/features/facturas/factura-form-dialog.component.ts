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

  readonly form = this.fb.nonNullable.group({
    pedidoId: [0, Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]]
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
      this.form.patchValue({ monto: pedido.total });
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const body = this.form.getRawValue();
    if (!body.pedidoId) {
      this.error.set('Seleccione un pedido');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.api.createFactura(body).subscribe({
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
