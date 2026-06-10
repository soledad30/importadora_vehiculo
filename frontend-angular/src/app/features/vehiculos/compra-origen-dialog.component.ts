import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { catchError, of } from 'rxjs';
import { Proveedor } from '../../core/models/ms-extensions';
import { TipoProveedorCompra, Vehiculo } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { Ms2Service } from '../../core/services/ms2.service';

@Component({
  selector: 'app-compra-origen-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    NbAlertModule,
    NbSpinnerModule
  ],
  template: `
    <div class="dialog-shell">
      <h3 class="dialog-title">Compra en origen (USA)</h3>
      <p class="dialog-sub">{{ vehiculo.marca }} {{ vehiculo.modelo }} {{ vehiculo.anio }} · VIN {{ vehiculo.vin }}</p>

      @if (error()) {
        <nb-alert status="danger" [closable]="false">{{ error() }}</nb-alert>
      }

      <form [formGroup]="form" class="dialog-form">
        <div class="form-field form-field-wide">
          <label>Tipo proveedor *</label>
          <nb-select formControlName="tipoProveedor" fullWidth>
            <nb-option value="SUBASTA">Subasta (Copart / IAA)</nb-option>
            <nb-option value="DEALER">Dealer / concesionario</nb-option>
            <nb-option value="PRIVADO">Vendedor privado</nb-option>
          </nb-select>
        </div>

        <div class="form-field form-field-wide">
          <label>Proveedor *</label>
          @if (usarListaProveedores()) {
            @if (cargandoProveedores()) {
              <div class="proveedor-loading">
                <nb-spinner size="tiny" status="primary" />
                Cargando proveedores…
              </div>
            } @else if (proveedoresFiltrados().length === 0) {
              <nb-alert status="warning" [closable]="false">
                No hay proveedores de subasta/dealer registrados.
                <a routerLink="/proveedores" class="proveedor-link">Ir a Proveedores</a>
              </nb-alert>
              <input nbInput fullWidth formControlName="proveedor" placeholder="Nombre del proveedor" />
            } @else {
              <nb-select formControlName="proveedor" fullWidth placeholder="Seleccione un proveedor">
                @for (p of proveedoresFiltrados(); track p.id) {
                  <nb-option [value]="p.nombre">{{ p.nombre }} — {{ p.detalle }}</nb-option>
                }
              </nb-select>
              <span class="field-hint">
                {{ proveedoresFiltrados().length }} proveedor(es) desde MS-2.
                <a routerLink="/proveedores" class="proveedor-link">Gestionar proveedores</a>
              </span>
            }
          } @else {
            <input nbInput fullWidth formControlName="proveedor" placeholder="Nombre del vendedor privado" />
            <span class="field-hint">Vendedor privado: escriba el nombre manualmente.</span>
          }
        </div>

        <div class="form-field">
          <label>Lote subasta</label>
          <input nbInput fullWidth formControlName="loteSubasta" placeholder="LOT-88421" />
        </div>
        <div class="form-field">
          <label>Precio FOB (USD) *</label>
          <input nbInput fullWidth type="number" step="0.01" formControlName="precioFob" />
        </div>
        <div class="form-field">
          <label>País origen</label>
          <input nbInput fullWidth formControlName="paisOrigen" />
        </div>
        <div class="form-field">
          <label>Ref. documento</label>
          <input nbInput fullWidth formControlName="referenciaDocumento" placeholder="FAC-2025-0089" />
        </div>
        <div class="form-field form-field-wide">
          <label>Notas</label>
          <input nbInput fullWidth formControlName="notas" />
        </div>
      </form>

      <div class="dialog-actions">
        <button type="button" nbButton status="basic" (click)="cancel()" [disabled]="saving()">Cancelar</button>
        <button type="button" nbButton status="primary" (click)="save()" [disabled]="saving() || cargandoProveedores()">
          @if (saving()) { <nb-spinner size="tiny" status="control" /> } @else { Registrar compra }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-shell { padding: 1.25rem; min-width: 400px; max-width: 520px; }
      .dialog-title { margin: 0 0 0.25rem; }
      .dialog-sub { color: var(--text-hint-color); margin: 0 0 1rem; font-size: 0.9rem; }
      .dialog-form { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .form-field { display: flex; flex-direction: column; gap: 0.35rem; }
      .form-field-wide { grid-column: 1 / -1; }
      .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
      .field-hint { font-size: 0.72rem; color: var(--text-hint-color); }
      .proveedor-loading {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: var(--text-hint-color);
        padding: 0.5rem 0;
      }
      .proveedor-link {
        color: #5b7cff;
        font-weight: 600;
        text-decoration: none;
        margin-left: 0.25rem;
      }
      .proveedor-link:hover { text-decoration: underline; }
    `
  ]
})
export class CompraOrigenDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ms2 = inject(Ms2Service);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(NbDialogRef<CompraOrigenDialogComponent>);

  @Input({ required: true }) vehiculo!: Vehiculo;
  @Input() proveedorPreseleccionado = '';

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly cargandoProveedores = signal(true);
  readonly proveedores = signal<Proveedor[]>([]);
  readonly tipoProveedorSel = signal<TipoProveedorCompra>('SUBASTA');

  readonly proveedoresFiltrados = computed(() => {
    const tipo = this.tipoProveedorSel();
    if (tipo === 'SUBASTA') {
      return this.proveedores().filter((p) => p.tipo === 'SUBASTA');
    }
    if (tipo === 'DEALER') {
      return this.proveedores().filter((p) => p.tipo === 'DEALER');
    }
    return [];
  });

  readonly usarListaProveedores = computed(() => {
    const t = this.tipoProveedorSel();
    return t === 'SUBASTA' || t === 'DEALER';
  });

  readonly form = this.fb.nonNullable.group({
    proveedor: ['', Validators.required],
    tipoProveedor: ['SUBASTA' as TipoProveedorCompra, Validators.required],
    loteSubasta: [''],
    precioFob: [0, [Validators.required, Validators.min(0.01)]],
    paisOrigen: ['Estados Unidos'],
    referenciaDocumento: [''],
    notas: ['']
  });

  ngOnInit(): void {
    this.form.patchValue({ precioFob: Math.round(this.vehiculo.precio * 0.75 * 100) / 100 });
    this.tipoProveedorSel.set(this.form.controls.tipoProveedor.value);

    this.form.controls.tipoProveedor.valueChanges.subscribe((tipo) => {
      this.tipoProveedorSel.set(tipo);
      this.aplicarProveedorPorDefecto();
    });

    this.cargandoProveedores.set(true);
    this.ms2
      .getProveedores()
      .pipe(catchError(() => of([] as Proveedor[])))
      .subscribe((lista) => {
        this.proveedores.set(lista);
        this.cargandoProveedores.set(false);
        this.aplicarProveedorPorDefecto(this.proveedorPreseleccionado);
      });
  }

  private aplicarProveedorPorDefecto(preferido?: string): void {
    const tipo = this.form.controls.tipoProveedor.value;

    if (tipo === 'PRIVADO') {
      this.form.patchValue({ proveedor: preferido?.trim() || '' });
      return;
    }

    const lista = this.proveedoresFiltrados();
    const match = preferido
      ? lista.find((p) => p.nombre.toLowerCase() === preferido.toLowerCase())
      : undefined;
    const seleccion = match?.nombre ?? lista[0]?.nombre ?? '';
    this.form.patchValue({ proveedor: seleccion });
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
    this.saving.set(true);
    this.api
      .createCompraOrigen({
        vehiculoId: this.vehiculo.id,
        proveedor: raw.proveedor.trim(),
        tipoProveedor: raw.tipoProveedor,
        loteSubasta: raw.loteSubasta || undefined,
        precioFob: raw.precioFob,
        paisOrigen: raw.paisOrigen || undefined,
        referenciaDocumento: raw.referenciaDocumento || undefined,
        notas: raw.notas || undefined
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.detail ?? 'No se pudo registrar la compra');
        }
      });
  }
}
