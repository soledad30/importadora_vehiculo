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
import { Ms3Service } from '../../core/services/ms3.service';

@Component({
  selector: 'app-documento-upload-dialog',
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
      <h3 class="dialog-title">{{ esAdjuntar() ? 'Subir archivo al documento' : 'Subir Documento' }}</h3>
      @if (esAdjuntar()) {
        <p class="dialog-sub">
          Adjunte el PDF o imagen faltante. Se ejecutará OCR automáticamente (MS-3).
        </p>
      }
      @if (error()) {
        <nb-alert status="danger" [closable]="false">{{ error() }}</nb-alert>
      }
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field form-field-wide">
          <label>Archivo</label>
          <input type="file" accept=".pdf,.html,.htm,image/*" (change)="onFile($event)" />
        </div>
        @if (!esAdjuntar()) {
          <div class="form-field">
            <label>VIN *</label>
            <input nbInput fullWidth formControlName="vin" placeholder="1HGBH41JXMN109186" />
          </div>
          <div class="form-field">
            <label>Vehículo (descripción)</label>
            <input nbInput fullWidth formControlName="vehiculo" placeholder="Toyota RAV4 2024" />
          </div>
          <div class="form-field">
            <label>Tipo de documento</label>
            <nb-select formControlName="tipo" fullWidth placeholder="Seleccione tipo">
              @for (t of tiposDocumento; track t.value) {
                <nb-option [value]="t.value">{{ t.label }}</nb-option>
              }
            </nb-select>
          </div>
        } @else {
          <div class="form-field form-field-wide meta-readonly">
            <span><strong>Vehículo:</strong> {{ form.controls.vehiculo.value }}</span>
            <span><strong>Tipo:</strong> {{ tipoLabel(form.controls.tipo.value) }}</span>
          </div>
        }
      </form>
      <div class="dialog-actions">
        <button type="button" nbButton status="basic" (click)="cancel()" [disabled]="saving()">Cancelar</button>
        <button type="button" nbButton status="primary" class="btn-save" (click)="save()" [disabled]="saving()">
          @if (saving()) {
            <nb-spinner size="tiny" status="control" />
          } @else if (esAdjuntar()) {
            SUBIR ARCHIVO Y ESCANEAR
          } @else {
            SUBIR Y ESCANEAR (MS-3)
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
      .meta-readonly {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 0.75rem;
        border-radius: 8px;
        background: var(--background-basic-color-3);
        font-size: 0.85rem;
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
export class DocumentoUploadDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<DocumentoUploadDialogComponent>);
  private readonly ms3 = inject(Ms3Service);

  @Input() docId = 0;
  @Input() vehiculo = '';
  @Input() tipo = 'Titulo';

  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly esAdjuntar = signal(false);
  private selectedFile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    vin: ['', [Validators.required, Validators.minLength(11)]],
    vehiculo: ['', Validators.required],
    tipo: ['Titulo', Validators.required]
  });

  ngOnInit(): void {
    if (this.docId) {
      this.esAdjuntar.set(true);
    }
    this.form.patchValue({
      vehiculo: this.vehiculo,
      tipo: this.tipo
    });
  }

  tipoLabel(tipo: string): string {
    return this.tiposDocumento.find((t) => t.value === tipo)?.label ?? tipo;
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      this.selectedFile = null;
      this.error.set('Seleccione un archivo');
      return;
    }
    this.selectedFile = input.files[0];
    this.error.set(null);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (!this.esAdjuntar() && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.selectedFile) {
      this.error.set('Seleccione un archivo');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const { vehiculo, tipo, vin } = this.form.getRawValue();

    const request = this.esAdjuntar()
      ? this.ms3.adjuntarArchivoDocumento(this.docId, this.selectedFile, vin)
      : this.ms3.uploadDocumento(this.selectedFile, vehiculo, tipo, vin);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudo subir el documento');
      }
    });
  }
}
