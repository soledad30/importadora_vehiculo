import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbAlertModule, NbButtonModule, NbDialogRef, NbInputModule, NbOptionModule, NbSelectModule, NbSpinnerModule } from '@nebular/theme';

@Component({
  selector: 'app-documento-upload-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, NbButtonModule, NbInputModule, NbSelectModule, NbOptionModule, NbAlertModule, NbSpinnerModule],
  template: `
    <div class="dialog-shell">
      <h3 class="dialog-title">Subir Documento</h3>
      @if (error()) { <nb-alert status="danger" [closable]="false">{{ error() }}</nb-alert> }
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field form-field-wide">
          <label>Archivo</label>
          <input type="file" (change)="onFile($event)" />
        </div>
        <div class="form-field">
          <label>Vehículo</label>
          <input nbInput fullWidth formControlName="vehiculo" placeholder="Toyota RAV4 2024" />
        </div>
        <div class="form-field">
          <label>Tipo de documento</label>
          <nb-select formControlName="tipo" fullWidth>
            <nb-option value="Titulo">Título</nb-option>
            <nb-option value="Factura">Factura</nb-option>
            <nb-option value="BL">Bill of Lading</nb-option>
            <nb-option value="Poliza">Póliza</nb-option>
          </nb-select>
        </div>
      </form>
      <div class="dialog-actions">
        <button type="button" nbButton status="basic" (click)="cancel()" [disabled]="saving()">Cancelar</button>
        <button type="button" nbButton status="primary" class="btn-save" (click)="save()" [disabled]="saving()">
          @if (saving()) { <nb-spinner size="tiny" status="control" /> } @else { SUBIR Y ESCANEAR (MS-3) }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-shell { padding: 1.5rem; min-width: min(480px, 92vw); background: var(--background-basic-color-2); border-radius: 12px; border: 2px solid #5b7cff; }
    .dialog-title { margin: 0 0 1rem; text-align: center; font-weight: 700; }
    .dialog-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.35rem; label { font-size: 0.8rem; color: var(--text-hint-color); } }
    .form-field-wide { grid-column: 1 / -1; }
    .dialog-actions { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-top: 1.25rem; }
    .btn-save { width: 100%; max-width: 300px; font-weight: 700; }
  `]
})
export class DocumentoUploadDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<DocumentoUploadDialogComponent>);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    vehiculo: ['', Validators.required],
    tipo: ['Titulo', Validators.required]
  });

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) this.error.set('Seleccione un archivo');
    else this.error.set(null);
  }

  cancel(): void { this.dialogRef.close(false); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    setTimeout(() => this.dialogRef.close(true), 800);
  }
}
