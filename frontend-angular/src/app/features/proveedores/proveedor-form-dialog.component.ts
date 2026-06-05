import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbAlertModule, NbButtonModule, NbDialogRef, NbInputModule, NbOptionModule, NbSelectModule, NbSpinnerModule } from '@nebular/theme';

@Component({
  selector: 'app-proveedor-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, NbButtonModule, NbInputModule, NbSelectModule, NbOptionModule, NbAlertModule, NbSpinnerModule],
  template: `
    <div class="dialog-shell">
      <h3 class="dialog-title">Nuevo Proveedor</h3>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field form-field-wide"><label>Nombre</label><input nbInput fullWidth formControlName="nombre" /></div>
        <div class="form-field"><label>Tipo</label>
          <nb-select formControlName="tipo" fullWidth>
            <nb-option value="SUBASTA">Subasta</nb-option>
            <nb-option value="NAVIERA">Naviera</nb-option>
            <nb-option value="DEALER">Dealer</nb-option>
            <nb-option value="AGENTE">Agente Aduanero</nb-option>
          </nb-select>
        </div>
        <div class="form-field"><label>Detalle / Ubicación</label><input nbInput fullWidth formControlName="detalle" /></div>
        <div class="form-field form-field-wide"><label>Métrica</label><input nbInput fullWidth formControlName="metrica" placeholder="ej. 18-22 días" /></div>
      </form>
      <div class="dialog-actions">
        <button type="button" nbButton status="basic" (click)="cancel()" [disabled]="saving()">Cancelar</button>
        <button type="button" nbButton status="primary" class="btn-save" (click)="save()" [disabled]="saving()">
          @if (saving()) { <nb-spinner size="tiny" status="control" /> } @else { GUARDAR PROVEEDOR }
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
    .btn-save { width: 100%; max-width: 280px; font-weight: 700; }
  `]
})
export class ProveedorFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<ProveedorFormDialogComponent>);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    tipo: ['SUBASTA', Validators.required],
    detalle: [''],
    metrica: ['']
  });

  cancel(): void { this.dialogRef.close(false); }
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    setTimeout(() => this.dialogRef.close(true), 600);
  }
}
