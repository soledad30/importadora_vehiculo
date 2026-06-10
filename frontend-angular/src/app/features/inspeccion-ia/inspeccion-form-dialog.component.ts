import { Component, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbAlertModule, NbButtonModule, NbDialogRef, NbInputModule, NbSpinnerModule } from '@nebular/theme';
import { ApiService } from '../../core/services/api.service';
import { FotosInspeccion360, Ms3Service } from '../../core/services/ms3.service';

type Vista360 = keyof FotosInspeccion360;

const VISTAS_360: { key: Vista360; label: string }[] = [
  { key: 'delante', label: 'Delante (parachoques frontal)' },
  { key: 'detras', label: 'Detrás (parachoques trasero)' },
  { key: 'izquierda', label: 'Lado izquierdo (puerta)' },
  { key: 'derecha', label: 'Lado derecho (puerta)' }
];

@Component({
  selector: 'app-inspeccion-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, NbButtonModule, NbInputModule, NbAlertModule, NbSpinnerModule],
  templateUrl: './inspeccion-form-dialog.component.html',
  styleUrl: './inspeccion-form-dialog.component.scss'
})
export class InspeccionFormDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<InspeccionFormDialogComponent>);
  private readonly ms3 = inject(Ms3Service);
  private readonly api = inject(ApiService);

  @Input() pedidoId?: number;
  @Input() vinDefault = '';
  @Input() vehiculoDefault = '';

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly validacionOk = signal<number | null>(null);
  readonly vistas360 = VISTAS_360;

  private selectedFile: File | null = null;
  private selectedDocument: File | null = null;
  private readonly fotos360: Partial<FotosInspeccion360> = {};
  private readonly previewUrls = new Map<Vista360, string>();

  readonly form = this.fb.nonNullable.group({
    vin: ['', [Validators.required, Validators.minLength(11)]],
    vehiculo: ['']
  });

  ngOnInit(): void {
    if (this.vinDefault) {
      this.form.patchValue({ vin: this.vinDefault, vehiculo: this.vehiculoDefault });
    }
  }

  ngOnDestroy(): void {
    for (const url of this.previewUrls.values()) {
      URL.revokeObjectURL(url);
    }
  }

  previewUrl(vista: Vista360): string | null {
    return this.previewUrls.get(vista) ?? null;
  }

  onFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (!this.selectedFile) this.error.set('Seleccione una foto del vehículo');
    else this.error.set(null);
  }

  onFoto360(vista: Vista360, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const prev = this.previewUrls.get(vista);
    if (prev) URL.revokeObjectURL(prev);

    if (file) {
      this.fotos360[vista] = file;
      this.previewUrls.set(vista, URL.createObjectURL(file));
    } else {
      delete this.fotos360[vista];
      this.previewUrls.delete(vista);
    }
    this.validacionOk.set(null);
    this.error.set(null);
  }

  onDocumento(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDocument = input.files?.[0] ?? null;
  }

  cancel(): void { this.dialogRef.close(false); }

  private formatApiError(err: { error?: { detail?: string | { mensaje?: string; problemas?: string[] } } }): string {
    const detail = err?.error?.detail;
    if (typeof detail === 'object' && detail?.problemas?.length) {
      return detail.problemas.join(' ');
    }
    if (typeof detail === 'object' && detail?.mensaje) {
      return detail.mensaje;
    }
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo analizar la inspección';
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    this.error.set(null);
    this.validacionOk.set(null);

    const onOk = () => {
      this.saving.set(false);
      this.dialogRef.close(true);
    };
    const onErr = (err: { error?: { detail?: string | { mensaje?: string; problemas?: string[] } } }) => {
      this.saving.set(false);
      this.error.set(this.formatApiError(err));
    };

    const { vin, vehiculo } = this.form.getRawValue();

    if (this.pedidoId) {
      if (!this.selectedFile) {
        this.saving.set(false);
        this.error.set('Seleccione una foto del vehículo');
        return;
      }
      this.api.inspeccionarPedido(this.pedidoId, this.selectedFile).subscribe({ next: onOk, error: onErr });
      return;
    }

    const faltantes = VISTAS_360.filter((v) => !this.fotos360[v.key]).map((v) => v.label);
    if (faltantes.length) {
      this.saving.set(false);
      this.error.set(`Faltan fotos: ${faltantes.join(', ')}`);
      return;
    }

    const fotos = this.fotos360 as FotosInspeccion360;

    this.ms3.validarVistas360(fotos).subscribe({
      next: (validacion) => {
        if (!validacion.valido) {
          this.saving.set(false);
          this.error.set(validacion.problemas.join(' '));
          return;
        }
        this.validacionOk.set(validacion.consistenciaMinima);
        this.ms3
          .analizarInspeccion360(fotos, vin, vehiculo, this.selectedDocument)
          .subscribe({ next: onOk, error: onErr });
      },
      error: onErr
    });
  }
}
