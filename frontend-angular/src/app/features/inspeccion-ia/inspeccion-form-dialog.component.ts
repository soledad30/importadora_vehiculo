import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbAlertModule, NbButtonModule, NbDialogRef, NbInputModule, NbSpinnerModule } from '@nebular/theme';

@Component({
  selector: 'app-inspeccion-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, NbButtonModule, NbInputModule, NbAlertModule, NbSpinnerModule],
  templateUrl: './inspeccion-form-dialog.component.html',
  styleUrl: './inspeccion-form-dialog.component.scss'
})
export class InspeccionFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<InspeccionFormDialogComponent>);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    vin: ['', [Validators.required, Validators.minLength(11)]]
  });

  onFoto(_event: Event): void { /* MS-3 upload */ }

  cancel(): void { this.dialogRef.close(false); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    setTimeout(() => this.dialogRef.close(true), 1000);
  }
}
