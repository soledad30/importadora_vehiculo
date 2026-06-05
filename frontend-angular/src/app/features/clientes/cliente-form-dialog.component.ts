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
import { Cliente, ClienteCreateRequest, TipoCliente } from '../../core/models';

export type ClienteDialogMode = 'create' | 'edit' | 'view';

export interface ClienteDialogContext {
  mode: ClienteDialogMode;
  cliente?: Cliente;
}

@Component({
  selector: 'app-cliente-form-dialog',
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
  templateUrl: './cliente-form-dialog.component.html',
  styleUrl: './cliente-form-dialog.component.scss'
})
export class ClienteFormDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<ClienteFormDialogComponent>);

  @Input() mode: ClienteDialogMode = 'create';
  @Input() cliente?: Cliente;

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly tipos: { value: TipoCliente; label: string }[] = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'VIP', label: 'VIP' },
    { value: 'NUEVO', label: 'Nuevo' }
  ];

  readonly form = this.fb.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    cedulaRuc: ['', Validators.required],
    direccion: [''],
    ciudad: [''],
    tipoCliente: ['REGULAR' as TipoCliente, Validators.required],
    notas: ['']
  });

  get isView(): boolean {
    return this.mode === 'view';
  }

  get title(): string {
    if (this.mode === 'create') return 'Formulario de Nuevo Cliente';
    if (this.mode === 'edit') return 'Editar Cliente';
    return 'Detalle del Cliente';
  }

  ngOnInit(): void {
    const c = this.cliente;
    if (c) {
      this.form.patchValue({
        nombreCompleto: c.nombreCompleto || `${c.nombres} ${c.apellidos}`.trim(),
        email: c.email,
        telefono: c.telefono ?? '',
        cedulaRuc: c.numeroDocumento,
        direccion: c.direccion ?? '',
        ciudad: c.ciudad ?? '',
        tipoCliente: c.tipoCliente,
        notas: c.notas ?? ''
      });
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

    const body = this.form.getRawValue() as ClienteCreateRequest;
    const id = this.cliente?.id;
    const req = id ? this.api.updateCliente(id, body) : this.api.createCliente(body);

    this.saving.set(true);
    this.error.set(null);
    req.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail ?? 'Error al guardar el cliente');
      }
    });
  }
}
