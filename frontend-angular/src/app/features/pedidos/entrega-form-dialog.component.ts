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
import { ApiService } from '../../core/services/api.service';
import { EntregaRequest, Pedido } from '../../core/models';

@Component({
  selector: 'app-entrega-form-dialog',
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
      <h3 class="dialog-title">Entrega y traspaso — {{ pedido.codigo }}</h3>
      <p class="dialog-sub">VIN: {{ pedido.vehiculoVin }} · Cliente: {{ pedido.clienteNombre }}</p>
      <p class="dialog-intro">
        Acta de entrega al comprador. <strong>Recibido por</strong> es quien retira el vehículo
        (cliente o persona autorizada), no el vendedor de la importadora.
      </p>

      @if (error()) {
        <nb-alert status="danger" [closable]="false">{{ error() }}</nb-alert>
      }

      <form [formGroup]="form" class="dialog-form">
        <div class="form-field form-field-wide">
          <label>Recibido por (comprador) *</label>
          <input nbInput fullWidth formControlName="recibidoPor" placeholder="Nombre de quien recibe el vehículo" />
          <small class="field-hint">Normalmente el cliente del pedido o quien venga con carta poder.</small>
        </div>
        <div class="form-field">
          <label>Lugar de entrega</label>
          <input nbInput fullWidth formControlName="lugarEntrega" placeholder="Patio importadora" />
        </div>
        <div class="form-field">
          <label>Tipo comprador *</label>
          <nb-select formControlName="tipoComprador" fullWidth>
            <nb-option value="PERSONA_NATURAL">Persona natural</nb-option>
            <nb-option value="EMPRESA">Empresa</nb-option>
          </nb-select>
        </div>
        @if (form.controls.tipoComprador.value === 'EMPRESA') {
          <div class="form-field">
            <label>Razón social *</label>
            <input nbInput fullWidth formControlName="titularNombre" />
          </div>
          <div class="form-field">
            <label>RTN *</label>
            <input nbInput fullWidth formControlName="rtn" />
          </div>
        }
        <div class="form-field">
          <label>Documento identidad recibe</label>
          <input nbInput fullWidth formControlName="numeroDocumentoRecibe" placeholder="Cédula o pasaporte" />
        </div>
        <div class="form-field">
          <label>Notario (traspaso)</label>
          <input nbInput fullWidth formControlName="notario" />
        </div>
        <div class="form-field form-field-wide">
          <label>Observaciones</label>
          <input nbInput fullWidth formControlName="observaciones" />
        </div>
      </form>

      <div class="dialog-actions">
        <button type="button" nbButton status="basic" (click)="cancel()" [disabled]="saving()">Cancelar</button>
        <button type="button" nbButton status="success" (click)="save()" [disabled]="saving()">
          @if (saving()) { <nb-spinner size="tiny" status="control" /> } @else { Confirmar entrega }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-shell { padding: 1.25rem; min-width: 420px; max-width: 560px; }
      .dialog-title { margin: 0 0 0.25rem; }
      .dialog-sub { color: var(--text-hint-color); margin: 0 0 0.5rem; font-size: 0.9rem; }
      .dialog-intro {
        margin: 0 0 1rem;
        font-size: 0.82rem;
        color: var(--text-hint-color);
        line-height: 1.45;
      }
      .field-hint { font-size: 0.72rem; color: var(--text-hint-color); margin-top: 0.2rem; }
      .dialog-form { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .form-field { display: flex; flex-direction: column; gap: 0.35rem; }
      .form-field-wide { grid-column: 1 / -1; }
      .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
    `
  ]
})
export class EntregaFormDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<EntregaFormDialogComponent>);

  @Input({ required: true }) pedido!: Pedido;

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    recibidoPor: ['', Validators.required],
    lugarEntrega: ['Patio importadora'],
    tipoDocumentoRecibe: ['CEDULA'],
    numeroDocumentoRecibe: [''],
    kilometraje: [null as number | null],
    observaciones: [''],
    tipoComprador: ['PERSONA_NATURAL' as 'PERSONA_NATURAL' | 'EMPRESA', Validators.required],
    titularNombre: [''],
    rtn: [''],
    notario: [''],
    numeroTraspaso: ['']
  });

  ngOnInit(): void {
    const cliente = this.pedido.clienteNombre?.trim() ?? '';
    if (cliente) {
      this.form.patchValue({ recibidoPor: cliente, titularNombre: cliente });
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
    const raw = this.form.getRawValue();
    const body: EntregaRequest = {
      recibidoPor: raw.recibidoPor,
      lugarEntrega: raw.lugarEntrega || undefined,
      tipoDocumentoRecibe: raw.tipoDocumentoRecibe || undefined,
      numeroDocumentoRecibe: raw.numeroDocumentoRecibe || undefined,
      kilometraje: raw.kilometraje ?? undefined,
      observaciones: raw.observaciones || undefined,
      tipoComprador: raw.tipoComprador,
      titularNombre: raw.titularNombre || undefined,
      rtn: raw.rtn || undefined,
      notario: raw.notario || undefined,
      numeroTraspaso: raw.numeroTraspaso || undefined
    };

    this.saving.set(true);
    this.api.entregarPedido(this.pedido.id, body).subscribe({
      next: (result) => this.dialogRef.close(result),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail ?? 'Error al registrar entrega');
      }
    });
  }
}
