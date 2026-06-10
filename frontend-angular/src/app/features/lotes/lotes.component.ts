import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbDialogService,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { EstadoLote, LoteImportacion, Vehiculo } from '../../core/models';
import { LoteAsignarVehiculoDialogComponent } from './lote-asignar-vehiculo-dialog.component';
import { LoteFormDialogComponent } from './lote-form-dialog.component';

const ESTADO_LABELS: Record<EstadoLote, string> = {
  PLANIFICADO: 'Planificado',
  EMBARCADO: 'Embarcado',
  EN_TRANSITO: 'En tránsito',
  EN_ADUANA: 'En aduana',
  LIBERADO: 'Liberado',
  EN_PATIO: 'En patio'
};

const SIGUIENTE_ESTADO: Partial<Record<EstadoLote, string>> = {
  PLANIFICADO: 'Embarcado',
  EMBARCADO: 'En tránsito',
  EN_TRANSITO: 'En aduana',
  EN_ADUANA: 'Liberado',
  LIBERADO: 'En patio'
};

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [DatePipe, NbCardModule, NbButtonModule, NbIconModule, NbAlertModule, NbSpinnerModule],
  templateUrl: './lotes.component.html',
  styleUrl: './lotes.component.scss'
})
export class LotesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(NbDialogService);

  readonly lotes = signal<LoteImportacion[]>([]);
  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly avanzandoId = signal<number | null>(null);
  readonly estadoLabels = ESTADO_LABELS;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ lotes: this.api.getLotes(), vehiculos: this.api.getVehiculos() }).subscribe({
      next: ({ lotes, vehiculos }) => {
        this.lotes.set(lotes);
        this.vehiculos.set(vehiculos);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? 'Error al cargar lotes');
      }
    });
  }

  crearLote(): void {
    this.dialog
      .open(LoteFormDialogComponent, {
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.load();
      });
  }

  avanzar(l: LoteImportacion): void {
    if (l.estado === 'EN_PATIO') return;
    this.avanzandoId.set(l.id);
    this.api.avanzarLote(l.id).subscribe({
      next: () => {
        this.avanzandoId.set(null);
        this.load();
      },
      error: (err) => {
        this.avanzandoId.set(null);
        this.error.set(err?.error?.detail ?? 'No se pudo avanzar el lote');
      }
    });
  }

  asignar(l: LoteImportacion): void {
    this.error.set(null);
    this.dialog
      .open(LoteAsignarVehiculoDialogComponent, {
        context: { lote: l, vehiculos: this.vehiculos() },
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.load();
      });
  }

  siguienteEstado(estado: EstadoLote): string | null {
    return SIGUIENTE_ESTADO[estado] ?? null;
  }

  estadoClass(estado: EstadoLote): string {
    const map: Record<EstadoLote, string> = {
      PLANIFICADO: 'estado-planificado',
      EMBARCADO: 'estado-embarcado',
      EN_TRANSITO: 'estado-transito',
      EN_ADUANA: 'estado-aduana',
      LIBERADO: 'estado-liberado',
      EN_PATIO: 'estado-patio'
    };
    return map[estado] ?? 'estado-planificado';
  }
}
