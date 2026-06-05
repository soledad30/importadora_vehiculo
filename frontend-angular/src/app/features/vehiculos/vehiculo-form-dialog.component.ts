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
import { Vehiculo } from '../../core/models';

export type VehiculoDialogMode = 'create' | 'edit';

export interface VehiculoDialogContext {
  mode: VehiculoDialogMode;
  vehiculo?: Vehiculo;
}

@Component({
  selector: 'app-vehiculo-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NbDialogModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    NbAlertModule,
    NbSpinnerModule
  ],
  templateUrl: './vehiculo-form-dialog.component.html',
  styleUrl: './vehiculo-form-dialog.component.scss'
})
export class VehiculoFormDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<VehiculoFormDialogComponent>);

  @Input() mode: VehiculoDialogMode = 'create';
  @Input() vehiculo?: Vehiculo;

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly estados = ['DISPONIBLE', 'RESERVADO', 'EN_IMPORTACION', 'VENDIDO'] as const;

  readonly form = this.fb.nonNullable.group({
    vin: ['', [Validators.required, Validators.maxLength(32)]],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(1900)]],
    color: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    estado: ['DISPONIBLE' as string, Validators.required],
    imagenUrl: ['', [Validators.maxLength(500)]]
  });

  get title(): string {
    return this.mode === 'create' ? 'Nuevo vehículo' : 'Editar vehículo';
  }

  ngOnInit(): void {
    const v = this.vehiculo;
    if (v) {
      this.form.patchValue({
        vin: v.vin,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        color: v.color,
        precio: v.precio,
        estado: v.estado,
        imagenUrl: v.imagenUrl ?? ''
      });
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
    const raw = this.form.getRawValue();
    const body = {
      ...raw,
      imagenUrl: raw.imagenUrl?.trim() || undefined
    };
    const id = this.vehiculo?.id;
    const req = id ? this.api.updateVehiculo(id, body) : this.api.createVehiculo(body);

    this.saving.set(true);
    this.error.set(null);
    req.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail ?? 'Error al guardar el vehículo');
      }
    });
  }
}
