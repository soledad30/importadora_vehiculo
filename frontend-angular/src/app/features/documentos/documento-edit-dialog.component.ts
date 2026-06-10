import { Component, inject, Input, OnInit, signal } from '@angular/core';
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
import { TIPOS_DOCUMENTO } from '../../core/constants/tipos-documento';
import { DocumentoImportacion } from '../../core/models/ms-extensions';
import { Ms3Service } from '../../core/services/ms3.service';

@Component({
  selector: 'app-documento-edit-dialog',
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
  template: `
    <div class="dialog-shell">
      <h3 class="dialog-title">Editar documento</h3>
      <p class="dialog-sub">Actualice los datos del registro sin cambiar el archivo.</p>
      @if (error()) {
        <nb-alert status="danger" [closable]="false">{{ error() }}</nb-alert>
      }
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field form-field-wide">
          <label>Nombre del documento</label>
          <input nbInput fullWidth formControlName="nombre" placeholder="BL-2025-0045.pdf" />
        </div>
        <div class="form-field">
          <label>Vehículo</label>
          <input nbInput fullWidth formControlName="vehiculo" placeholder="Nissan Rogue 2024" />
        </div>
        <div class="form-field">
          <label>Tipo de documento</label>
          <nb-select formControlName="tipo" fullWidth placeholder="Seleccione tipo">
            @for (t of tiposDocumento; track t.value) {
              <nb-option [value]="t.value">{{ t.label }}</nb-option>
            }
          </nb-select>
        </div>
        <div class="form-field">
          <label>Fecha</label>
          <input nbInput fullWidth type="date" formControlName="fecha" />
        </div>
      </form>
      <div class="dialog-actions">
        <button type="button" nbButton status="basic" (click)="cancel()" [disabled]="saving()">Cancelar</button>
        <button type="button" nbButton status="primary" class="btn-save" (click)="save()" [disabled]="saving()">
          @if (saving()) {
            <nb-spinner size="tiny" status="control" />
          } @else {
            GUARDAR CAMBIOS
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-shell {
        padding: 1.5rem;
        min-width: min(480px, 92vw);
        background: var(--background-basic-color-2);
        border-radius: 12px;
        border: 2px solid #5b7cff;
      }
      .dialog-title {
        margin: 0 0 0.35rem;
        text-align: center;
        font-weight: 700;
      }
      .dialog-sub {
        margin: 0 0 1rem;
        text-align: center;
        font-size: 0.82rem;
        color: var(--text-hint-color);
      }
      .dialog-form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        label {
          font-size: 0.8rem;
          color: var(--text-hint-color);
        }
        nb-select {
          width: 100%;
        }
      }
      .form-field-wide {
        grid-column: 1 / -1;
      }
      .dialog-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        margin-top: 1.25rem;
      }
      .btn-save {
        width: 100%;
        max-width: 300px;
        font-weight: 700;
      }
    `
  ]
})
export class DocumentoEditDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<DocumentoEditDialogComponent>);
  private readonly ms3 = inject(Ms3Service);

  @Input() documento!: DocumentoImportacion;

  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    vehiculo: ['', Validators.required],
    tipo: ['Titulo', Validators.required],
    fecha: ['', Validators.required]
  });

  ngOnInit(): void {
    if (this.documento) {
      this.form.patchValue({
        nombre: this.documento.nombre,
        vehiculo: this.documento.vehiculo,
        tipo: this.documento.tipo,
        fecha: this.documento.fecha
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

    this.saving.set(true);
    this.error.set(null);
    const { nombre, vehiculo, tipo, fecha } = this.form.getRawValue();
    this.ms3.actualizarDocumento(this.documento.id, { nombre, vehiculo, tipo, fecha }).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudo actualizar el documento');
      }
    });
  }
}
