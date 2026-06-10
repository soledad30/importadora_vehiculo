import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NbButtonModule, NbDialogRef, NbIconModule } from '@nebular/theme';
import { Proveedor } from '../../core/models/ms-extensions';

const ROL_POR_TIPO: Record<Proveedor['tipo'], string> = {
  SUBASTA: 'Compra del vehículo en subasta USA (origen del embarque).',
  DEALER: 'Compra directa al dealer — ideal cuando ML recomienda un modelo concreto.',
  NAVIERA: 'Transporte marítimo origen → puerto Honduras (vincula al embarque MS-2).',
  AGENTE: 'Despacho aduanero y liberación en puerto (post-arribo).'
};

const TIPO_LABEL: Record<Proveedor['tipo'], string> = {
  SUBASTA: 'Subasta',
  NAVIERA: 'Naviera',
  DEALER: 'Dealer',
  AGENTE: 'Agente aduanero'
};

@Component({
  selector: 'app-proveedor-detail-dialog',
  standalone: true,
  imports: [NbButtonModule, NbIconModule],
  template: `
    <div class="dialog-shell">
      <span class="tipo-badge">{{ tipoLabel() }}</span>
      <h3 class="dialog-title">{{ proveedor.nombre }}</h3>
      <p class="detalle">{{ proveedor.detalle }}</p>
      <p class="metrica">{{ proveedor.metrica }}</p>

      <div class="rol-box">
        <strong>Rol en la importación</strong>
        <p>{{ rol() }}</p>
      </div>

      @if (planVehiculo) {
        <p class="plan-hint">
          Plan ML: <strong>{{ planVehiculo }}</strong> — este proveedor puede usarse en la cadena de compra/embarque.
        </p>
      }

      <div class="dialog-actions">
        @if (proveedor.tipo === 'SUBASTA' || proveedor.tipo === 'DEALER') {
          <button type="button" nbButton status="primary" (click)="irImportaciones()">
            Planificar importación
          </button>
          <button type="button" nbButton status="info" (click)="irCotizador()">
            Cotizar costos
          </button>
        }
        @if (proveedor.tipo === 'NAVIERA') {
          <button type="button" nbButton status="primary" (click)="irImportaciones()">
            Ver embarques / naviera
          </button>
        }
        @if (proveedor.tipo === 'AGENTE') {
          <button type="button" nbButton status="primary" (click)="irDocumentos()">
            Ver documentos aduaneros
          </button>
          <button type="button" nbButton status="info" (click)="irImportaciones()">
            Seguimiento importación
          </button>
        }
        <button type="button" nbButton status="basic" (click)="cerrar()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-shell { padding: 1.5rem; min-width: min(420px, 92vw); max-width: 480px; }
    .tipo-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #5b7cff;
      margin-bottom: 0.35rem;
    }
    .dialog-title { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .detalle { margin: 0; color: var(--text-hint-color); }
    .metrica { margin: 0.35rem 0 1rem; font-weight: 700; color: #ffaa00; }
    .rol-box {
      padding: 0.85rem;
      border-radius: 8px;
      background: rgba(91, 124, 255, 0.08);
      border: 1px solid rgba(91, 124, 255, 0.2);
      margin-bottom: 1rem;
      strong { display: block; margin-bottom: 0.35rem; font-size: 0.85rem; }
      p { margin: 0; font-size: 0.88rem; line-height: 1.45; }
    }
    .plan-hint { font-size: 0.85rem; margin: 0 0 1rem; color: var(--text-hint-color); }
    .dialog-actions { display: flex; flex-direction: column; gap: 0.5rem; }
  `]
})
export class ProveedorDetailDialogComponent {
  private readonly dialogRef = inject(NbDialogRef<ProveedorDetailDialogComponent>);
  private readonly router = inject(Router);

  @Input({ required: true }) proveedor!: Proveedor;
  @Input() planVehiculo: string | null = null;
  @Input() planMarca = '';
  @Input() planModelo = '';
  @Input() planCantidad = 1;

  tipoLabel(): string {
    return TIPO_LABEL[this.proveedor.tipo];
  }

  rol(): string {
    return ROL_POR_TIPO[this.proveedor.tipo];
  }

  irImportaciones(): void {
    const q: Record<string, string> = { planificar: '1' };
    if (this.planMarca) q['marca'] = this.planMarca;
    if (this.planModelo) q['modelo'] = this.planModelo;
    if (this.planCantidad) q['cantidad'] = String(this.planCantidad);
    if (this.proveedor.tipo === 'NAVIERA') {
      q['naviera'] = this.proveedor.nombre;
    }
    q['proveedor'] = this.proveedor.nombre;
    this.dialogRef.close(true);
    void this.router.navigate(['/importaciones'], { queryParams: q });
  }

  irCotizador(): void {
    this.dialogRef.close(true);
    void this.router.navigate(['/cotizador'], {
      queryParams: {
        marca: this.planMarca || undefined,
        modelo: this.planModelo || undefined,
        proveedor: this.proveedor.nombre
      }
    });
  }

  irDocumentos(): void {
    this.dialogRef.close(true);
    void this.router.navigate(['/documentos']);
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
