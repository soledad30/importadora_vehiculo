import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbDialogRef,
  NbInputModule,
  NbOptionModule,
  NbSelectModule,
  NbSpinnerModule
} from '@nebular/theme';
import { PUERTOS_DESTINO, PUERTOS_EMBARQUE } from '../../core/constants/puertos-importacion';
import { ApiService } from '../../core/services/api.service';

const NAVIERAS = [
  'Evergreen Line',
  'Maersk',
  'MSC',
  'CMA CGM',
  'Hapag-Lloyd',
  'COSCO',
  'Por asignar'
] as const;

@Component({
  selector: 'app-lote-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    NbAlertModule,
    NbSpinnerModule
  ],
  templateUrl: './lote-form-dialog.component.html',
  styleUrl: './lote-form-dialog.component.scss'
})
export class LoteFormDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<LoteFormDialogComponent>);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly puertosOrigen = PUERTOS_EMBARQUE;
  readonly puertosDestino = PUERTOS_DESTINO;
  readonly navieras = NAVIERAS;

  readonly form = this.fb.nonNullable.group({
    numeroContenedor: ['', [Validators.required, Validators.maxLength(40)]],
    naviera: ['Evergreen Line', Validators.required],
    puertoOrigen: ['Houston, TX', Validators.required],
    puertoDestino: ['Puerto Cortés, HN', Validators.required],
    fechaEmbarque: [new Date().toISOString().slice(0, 10)],
    notas: ['', Validators.maxLength(500)]
  });

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.api
      .createLote({
        numeroContenedor: raw.numeroContenedor.trim(),
        naviera: raw.naviera,
        puertoOrigen: raw.puertoOrigen,
        puertoDestino: raw.puertoDestino,
        fechaEmbarque: raw.fechaEmbarque || undefined,
        notas: raw.notas.trim() || undefined
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.detail ?? 'No se pudo crear el lote');
        }
      });
  }
}
