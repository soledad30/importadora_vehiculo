import { Component, Input, inject } from '@angular/core';
import { NbButtonModule, NbDialogModule, NbDialogRef } from '@nebular/theme';

export type ConfirmDialogStatus = 'basic' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NbDialogModule, NbButtonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(NbDialogRef<ConfirmDialogComponent>);

  @Input() title = 'Confirmar';
  @Input() message = '';
  @Input() confirmLabel = 'Aceptar';
  @Input() cancelLabel = 'Cancelar';
  @Input() confirmStatus: ConfirmDialogStatus = 'primary';

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
