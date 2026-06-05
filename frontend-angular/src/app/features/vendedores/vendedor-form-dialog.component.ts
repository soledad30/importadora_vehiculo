import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbDialogModule,
  NbDialogRef,
  NbInputModule,
  NbSpinnerModule
} from '@nebular/theme';
import { ApiService } from '../../core/services/api.service';
import { Vendedor, VendedorCreateRequest } from '../../core/models';

export type VendedorDialogMode = 'create' | 'view';

export interface VendedorDialogContext {
  mode: VendedorDialogMode;
  vendedor?: Vendedor;
}

@Component({
  selector: 'app-vendedor-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NbDialogModule,
    NbButtonModule,
    NbInputModule,
    NbAlertModule,
    NbSpinnerModule
  ],
  templateUrl: './vendedor-form-dialog.component.html',
  styleUrl: './vendedor-form-dialog.component.scss'
})
export class VendedorFormDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<VendedorFormDialogComponent>);

  @Input() mode: VendedorDialogMode = 'create';
  @Input() vendedor?: Vendedor;

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', Validators.required],
    zonaAsignada: [''],
    fechaIngreso: [''],
    email: ['', [Validators.required, Validators.email]],
    cedula: ['', Validators.required],
    metaMensual: [null as number | null],
    comisionPorcentaje: [2.5, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  get isView(): boolean {
    return this.mode === 'view';
  }

  get title(): string {
    return this.isView ? 'Detalle del Vendedor' : 'Formulario de Nuevo Vendedor';
  }

  ngOnInit(): void {
    const v = this.vendedor;
    if (v) {
      this.form.patchValue({
        nombreCompleto: v.nombreCompleto,
        telefono: v.telefono,
        zonaAsignada: v.zonaAsignada ?? '',
        fechaIngreso: v.fechaIngreso ?? '',
        email: v.email,
        cedula: v.cedula,
        metaMensual: v.metaMensual ?? null,
        comisionPorcentaje: v.comisionPorcentaje
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      this.form.patchValue({ fechaIngreso: today });
    }
    if (this.isView) {
      this.form.disable();
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.isView) {
      this.dialogRef.close(false);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const body: VendedorCreateRequest = {
      nombreCompleto: raw.nombreCompleto,
      email: raw.email,
      telefono: raw.telefono,
      cedula: raw.cedula,
      zonaAsignada: raw.zonaAsignada || undefined,
      fechaIngreso: raw.fechaIngreso || undefined,
      metaMensual: raw.metaMensual ?? undefined,
      comisionPorcentaje: raw.comisionPorcentaje
    };

    this.saving.set(true);
    this.error.set(null);
    this.api.createVendedor(body).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail ?? 'Error al guardar el vendedor');
      }
    });
  }
}
