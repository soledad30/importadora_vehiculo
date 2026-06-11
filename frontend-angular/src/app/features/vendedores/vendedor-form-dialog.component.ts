import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { emailFormatValidator, parseDecimalInput } from '../../core/utils/form-validators';
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
    email: ['', [Validators.required, emailFormatValidator]],
    cedula: ['', Validators.required],
    metaMensual: [null as number | null],
    comisionPorcentaje: ['2.5', Validators.required]
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
        comisionPorcentaje: String(v.comisionPorcentaje)
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
      this.error.set(this.describeFormErrors());
      return;
    }

    const raw = this.form.getRawValue();
    const comisionPorcentaje = parseDecimalInput(raw.comisionPorcentaje);
    if (comisionPorcentaje == null || comisionPorcentaje < 0 || comisionPorcentaje > 100) {
      this.error.set('La comisión debe ser un número entre 0 y 100 (use punto o coma decimal).');
      return;
    }

    const body: VendedorCreateRequest = {
      nombreCompleto: raw.nombreCompleto,
      email: raw.email,
      telefono: raw.telefono,
      cedula: raw.cedula,
      zonaAsignada: raw.zonaAsignada || undefined,
      fechaIngreso: raw.fechaIngreso || undefined,
      metaMensual: raw.metaMensual ?? undefined,
      comisionPorcentaje
    };

    this.saving.set(true);
    this.error.set(null);
    this.api.createVendedor(body).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.resolveApiError(err));
      }
    });
  }

  private describeFormErrors(): string {
    const messages: string[] = [];
    const f = this.form.controls;

    if (f.nombreCompleto.errors?.['required'] || f.nombreCompleto.errors?.['minlength']) {
      messages.push('Nombre completo requerido (mínimo 3 caracteres)');
    }
    if (f.email.errors?.['required'] || f.email.errors?.['email']) {
      messages.push('Correo electrónico inválido');
    }
    if (f.telefono.errors?.['required']) {
      messages.push('Teléfono requerido');
    }
    if (f.cedula.errors?.['required']) {
      messages.push('Cédula requerida');
    }
    if (f.comisionPorcentaje.errors?.['required'] || f.comisionPorcentaje.errors?.['min'] || f.comisionPorcentaje.errors?.['max']) {
      messages.push('Comisión inválida (0 a 100)');
    }

    return messages.join('. ') || 'Revise los campos del formulario.';
  }

  private resolveApiError(err: { error?: { detail?: string; errors?: Record<string, string> } }): string {
    const body = err.error;
    if (body?.detail) {
      return body.detail;
    }
    if (body?.errors) {
      return Object.values(body.errors).join(' ');
    }
    return 'Error al guardar el vendedor';
  }
}
