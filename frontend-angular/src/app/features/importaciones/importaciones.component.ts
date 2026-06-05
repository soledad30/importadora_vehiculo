import { Component, inject, OnInit, signal } from '@angular/core';
import {
  NbAlertModule,
  NbCardModule,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { catchError, forkJoin, of } from 'rxjs';
import { Importacion } from '../../core/models';
import {
  EmbarqueSeguimiento,
  EstadoEmbarqueBadge,
  EtapaEmbarque
} from '../../core/models/ms-extensions';
import { ApiService } from '../../core/services/api.service';
import { Ms2MockService } from '../../core/services/ms2-mock.service';

const ETAPA_LABELS: Record<EtapaEmbarque, string> = {
  COMPRADO: 'Comprado',
  EMBARCADO: 'Embarcado',
  EN_TRANSITO: 'En Tránsito',
  EN_ADUANA: 'En Aduana',
  LIBERADO: 'Liberado',
  EN_LOTE: 'En Lote'
};

const ETAPAS: EtapaEmbarque[] = [
  'COMPRADO',
  'EMBARCADO',
  'EN_TRANSITO',
  'EN_ADUANA',
  'LIBERADO',
  'EN_LOTE'
];

@Component({
  selector: 'app-importaciones',
  standalone: true,
  imports: [NbCardModule, NbSpinnerModule, NbAlertModule, NbIconModule],
  templateUrl: './importaciones.component.html',
  styleUrl: './importaciones.component.scss'
})
export class ImportacionesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ms2 = inject(Ms2MockService);

  readonly embarques = signal<EmbarqueSeguimiento[]>([]);
  readonly resumen = signal({ enTransito: 0, enAduana: 0, pendientePago: 0, completadasMes: 0 });
  readonly proximas = signal<{ codigo: string; vehiculo: string; fecha: string; diasRestantes: number }[]>([]);
  readonly loading = signal(true);
  readonly etapaLabels = ETAPA_LABELS;

  ngOnInit(): void {
    this.api.getImportaciones().pipe(
      catchError(() => of([] as Importacion[]))
    ).subscribe({
      next: (importaciones) => {
        if (importaciones.length) {
          this.embarques.set(importaciones.map((i) => this.mapImportacion(i)));
          this.resumen.set(this.calcularResumen(importaciones));
          this.proximas.set(this.calcularProximas(importaciones));
          this.loading.set(false);
        } else {
          this.cargarMock();
        }
      },
      error: () => this.cargarMock()
    });
  }

  private cargarMock(): void {
    forkJoin({
      embarques: this.ms2.getEmbarques(),
      resumen: this.ms2.getResumenImportaciones(),
      proximas: this.ms2.getProximasLlegadas()
    }).subscribe({
      next: ({ embarques, resumen, proximas }) => {
        this.embarques.set(embarques);
        this.resumen.set(resumen);
        this.proximas.set(proximas);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private mapImportacion(i: Importacion): EmbarqueSeguimiento {
    const etapa = this.mapEtapa(i.estado);
    return {
      id: String(i.id),
      codigo: i.codigo,
      vehiculo: i.vehiculoTitulo ?? 'Vehículo importado',
      referencia: i.vehiculoVin
        ? `VIN: ${i.vehiculoVin}`
        : i.numeroContenedor
          ? `Contenedor: ${i.numeroContenedor}`
          : i.numeroBl
            ? `BL: ${i.numeroBl}`
            : `Pedido ${i.pedidoCodigo ?? i.pedidoId}`,
      origen: i.puertoOrigen ?? i.paisOrigen,
      destino: i.puertoDestino ?? i.aduana,
      naviera: i.naviera ?? 'Por asignar',
      estadoBadge: this.mapBadge(i.estado),
      etapaActual: etapa,
      etapas: ETAPAS
    };
  }

  private mapEtapa(estado: string): EtapaEmbarque {
    const map: Record<string, EtapaEmbarque> = {
      SOLICITADA: 'EMBARCADO',
      EN_TRANSITO: 'EN_TRANSITO',
      EN_ADUANA: 'EN_ADUANA',
      LIBERADA: 'LIBERADO',
      COMPLETADA: 'EN_LOTE'
    };
    return map[estado] ?? 'EN_TRANSITO';
  }

  private mapBadge(estado: string): EstadoEmbarqueBadge {
    const map: Record<string, EstadoEmbarqueBadge> = {
      SOLICITADA: 'EN_TRANSITO',
      EN_TRANSITO: 'EN_TRANSITO',
      EN_ADUANA: 'EN_ADUANA',
      LIBERADA: 'LIBERADO',
      COMPLETADA: 'COMPLETADO'
    };
    return map[estado] ?? 'EN_TRANSITO';
  }

  private calcularResumen(items: Importacion[]) {
    return {
      enTransito: items.filter((i) => ['SOLICITADA', 'EN_TRANSITO', 'LIBERADA'].includes(i.estado)).length,
      enAduana: items.filter((i) => i.estado === 'EN_ADUANA').length,
      pendientePago: 0,
      completadasMes: items.filter((i) => i.estado === 'COMPLETADA').length
    };
  }

  private calcularProximas(items: Importacion[]) {
    const hoy = new Date();
    return items
      .filter((i) => i.fechaEstimadaEntrega && i.estado !== 'COMPLETADA')
      .map((i) => {
        const fecha = new Date(i.fechaEstimadaEntrega!);
        const dias = Math.max(0, Math.ceil((fecha.getTime() - hoy.getTime()) / 86_400_000));
        return {
          codigo: i.codigo,
          vehiculo: i.vehiculoTitulo ?? 'Vehículo',
          fecha: i.fechaEstimadaEntrega!,
          diasRestantes: dias
        };
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 5);
  }

  etapaIndex(etapas: EtapaEmbarque[], actual: EtapaEmbarque): number {
    return etapas.indexOf(actual);
  }

  badgeClass(estado: string): string {
    const map: Record<string, string> = {
      EN_TRANSITO: 'badge-transito',
      EN_ADUANA: 'badge-aduana',
      LIBERADO: 'badge-liberado',
      COMPLETADO: 'badge-completado'
    };
    return map[estado] ?? 'badge-transito';
  }

  badgeLabel(estado: string): string {
    return estado.replace(/_/g, ' ');
  }
}
