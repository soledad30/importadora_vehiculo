import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbDialogRef,
  NbOptionModule,
  NbSelectModule,
  NbSpinnerModule
} from '@nebular/theme';
import { ApiService } from '../../core/services/api.service';
import { LoteImportacion, Vehiculo } from '../../core/models';

@Component({
  selector: 'app-lote-asignar-vehiculo-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NbButtonModule,
    NbSelectModule,
    NbOptionModule,
    NbAlertModule,
    NbSpinnerModule
  ],
  templateUrl: './lote-asignar-vehiculo-dialog.component.html',
  styleUrl: './lote-asignar-vehiculo-dialog.component.scss'
})
export class LoteAsignarVehiculoDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<LoteAsignarVehiculoDialogComponent>);

  @Input() lote!: LoteImportacion;
  @Input() vehiculos: Vehiculo[] = [];

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly disponibles = signal<Vehiculo[]>([]);
  readonly yaEnLote = signal<Vehiculo[]>([]);

  readonly form = this.fb.nonNullable.group({
    vehiculoId: [0, Validators.required]
  });

  ngOnInit(): void {
    const enEsteLote = this.vehiculos.filter((v) => v.loteId === this.lote.id);
    const sinLote = this.vehiculos.filter(
      (v) => !v.loteId && (v.estado === 'DISPONIBLE' || v.estado === 'EN_IMPORTACION')
    );
    this.yaEnLote.set(enEsteLote);
    this.disponibles.set(sinLote);
    if (sinLote.length) {
      this.form.patchValue({ vehiculoId: sinLote[0].id });
    }
  }

  tituloVehiculo(v: Vehiculo): string {
    return `${v.marca} ${v.modelo} ${v.anio} · ${v.vin}`;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid || !this.disponibles().length) {
      this.form.markAllAsTouched();
      return;
    }
    const vehiculoId = this.form.controls.vehiculoId.value;
    this.saving.set(true);
    this.error.set(null);
    this.api.asignarVehiculoLote(this.lote.id, vehiculoId).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudo asignar el vehículo');
      }
    });
  }
}
