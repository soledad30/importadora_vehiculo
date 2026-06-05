import { Component, inject, Input, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
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
import { Cliente, Vehiculo } from '../../core/models';

@Component({
  selector: 'app-pedido-form-dialog',
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
  templateUrl: './pedido-form-dialog.component.html',
  styleUrl: './pedido-form-dialog.component.scss'
})
export class PedidoFormDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<PedidoFormDialogComponent>);

  @Input() clientes: Cliente[] = [];
  @Input() vehiculos: Vehiculo[] = [];

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    clienteId: [0, Validators.required],
    vehiculoId: [0, Validators.required],
    impuestos: [0 as number | null],
    envio: [1500, [Validators.min(0)]],
    notas: ['']
  });

  readonly vehiculoSeleccionado = computed(() => {
    const id = this.form.controls.vehiculoId.value;
    return this.vehiculos.find((v) => v.id === id);
  });

  readonly preview = computed(() => {
    const v = this.vehiculoSeleccionado();
    if (!v) return null;
    const base = v.precio;
    const imp = this.form.controls.impuestos.value;
    const env = this.form.controls.envio.value ?? 1500;
    const impuestos = imp != null && imp > 0 ? imp : Math.round(base * 0.15 * 100) / 100;
    const envio = env >= 0 ? env : 1500;
    return { base, impuestos, envio, total: base + impuestos + envio };
  });

  ngOnInit(): void {
    this.form.controls.vehiculoId.valueChanges.subscribe(() => {
      const v = this.vehiculoSeleccionado();
      if (v && !this.form.controls.impuestos.value) {
        this.form.controls.impuestos.setValue(Math.round(v.precio * 0.15 * 100) / 100);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (!raw.clienteId || !raw.vehiculoId) {
      this.error.set('Seleccione cliente y vehículo');
      return;
    }

    const body = {
      clienteId: raw.clienteId,
      vehiculoId: raw.vehiculoId,
      notas: raw.notas || undefined,
      impuestos: raw.impuestos != null && raw.impuestos > 0 ? raw.impuestos : undefined,
      envio: raw.envio >= 0 ? raw.envio : undefined
    };

    this.saving.set(true);
    this.error.set(null);
    this.api.createPedido(body).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail ?? 'Error al crear el pedido');
      }
    });
  }
}
