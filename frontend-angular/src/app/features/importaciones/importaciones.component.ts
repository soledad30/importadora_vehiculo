import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbOptionModule,
  NbSelectModule,
  NbSpinnerModule
} from '@nebular/theme';
import { catchError, forkJoin, of } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { Importacion, ImpuestosAduana } from '../../core/models';
import {
  EmbarqueSeguimiento,
  EstadoEmbarqueBadge,
  EtapaEmbarque
} from '../../core/models/ms-extensions';
import { ApiService } from '../../core/services/api.service';
import { Ms2Service } from '../../core/services/ms2.service';
import { MarcaPickerComponent } from '../../core/components/marca-picker/marca-picker.component';
import { parseRecomendacionImportacion } from '../../core/utils/notificacion-prediccion.util';
import { RastreoMapaComponent } from './rastreo-mapa.component';

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
  imports: [
    FormsModule,
    CurrencyPipe,
    ReactiveFormsModule,
    NbCardModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    MarcaPickerComponent,
    RastreoMapaComponent
  ],
  templateUrl: './importaciones.component.html',
  styleUrl: './importaciones.component.scss'
})
export class ImportacionesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ms2 = inject(Ms2Service);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly embarques = signal<EmbarqueSeguimiento[]>([]);
  readonly search = signal('');
  readonly filterEtapa = signal<string>('TODAS');
  readonly filterEstado = signal<string>('TODOS');
  readonly resumen = signal({ enTransito: 0, enAduana: 0, pendientePago: 0, completadasMes: 0 });
  readonly proximas = signal<{ codigo: string; vehiculo: string; fecha: string; diasRestantes: number }[]>([]);
  readonly loading = signal(true);
  readonly fuenteMs2 = signal(false);
  readonly avanzando = signal<string | null>(null);
  readonly embarqueMapaId = signal<string | null>(null);
  readonly planificando = signal(false);
  readonly planExito = signal<string | null>(null);
  readonly planError = signal<string | null>(null);
  readonly mostrarPlan = signal(false);
  readonly etapaLabels = ETAPA_LABELS;
  readonly etapasFiltro = ETAPAS;
  readonly importacionesMs1 = signal<Importacion[]>([]);
  readonly suncaSeleccionada = signal<Importacion | null>(null);
  readonly impuestosSunca = signal<ImpuestosAduana | null>(null);
  readonly registrandoSunca = signal(false);
  readonly suncaError = signal<string | null>(null);
  readonly suncaExito = signal<string | null>(null);

  readonly planForm = this.fb.nonNullable.group({
    marca: ['Toyota', Validators.required],
    modelo: ['Hilux', Validators.required],
    cantidad: [5, [Validators.required, Validators.min(1), Validators.max(20)]],
    origen: ['Miami, FL', Validators.required],
    destino: ['Puerto Cortés, HN', Validators.required],
    naviera: ['Por asignar']
  });

  readonly suncaForm = this.fb.nonNullable.group({
    numeroDua: ['', Validators.required],
    agenteAduanal: ['', Validators.required],
    comprobantePagoSunca: ['', Validators.required],
    referenciaPoliza: ['']
  });

  readonly embarquesFiltrados = computed(() => {
    const q = this.search().trim().toLowerCase();
    const etapa = this.filterEtapa();
    const estado = this.filterEstado();
    return this.embarques().filter((e) => {
      if (etapa !== 'TODAS' && e.etapaActual !== etapa) return false;
      if (estado !== 'TODOS' && e.estadoBadge !== estado) return false;
      if (!q) return true;
      const haystack = [
        e.codigo,
        e.vehiculo,
        e.referencia,
        e.origen,
        e.destino,
        e.naviera,
        e.etapaActual,
        e.estadoBadge
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('planificar') === '1') {
        const rec = parseRecomendacionImportacion(
          params.get('motivo') ??
            `importar ${params.get('cantidad') ?? 5} ${params.get('marca') ?? 'Toyota'} ${params.get('modelo') ?? 'Hilux'}`
        );
        this.planForm.patchValue({
          marca: params.get('marca') ?? rec.marca,
          modelo: params.get('modelo') ?? rec.modelo,
          cantidad: Number(params.get('cantidad') ?? rec.cantidad),
          ...(params.get('naviera') ? { naviera: params.get('naviera')! } : {})
        });
        this.mostrarPlan.set(true);
        this.planExito.set(null);
        this.planError.set(null);
      } else {
        this.mostrarPlan.set(false);
      }
    });

    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.loading.set(true);
    forkJoin({
      ms2Embarques: this.ms2.getEmbarques().pipe(catchError(() => of([] as EmbarqueSeguimiento[]))),
      ms2Resumen: this.ms2.getResumenImportaciones().pipe(catchError(() => of(null))),
      ms2Proximas: this.ms2.getProximasLlegadas().pipe(catchError(() => of([]))),
      ms1Importaciones: this.api.getImportaciones().pipe(catchError(() => of([] as Importacion[])))
    }).subscribe({
      next: ({ ms2Embarques, ms2Resumen, ms2Proximas, ms1Importaciones }) => {
        this.importacionesMs1.set(ms1Importaciones);
        if (ms2Embarques.length) {
          this.embarques.set(ms2Embarques);
          this.embarqueMapaId.set(ms2Embarques[0].id);
          this.resumen.set(ms2Resumen ?? this.calcularResumenMs1(ms1Importaciones));
          this.proximas.set(ms2Proximas);
          this.fuenteMs2.set(true);
        } else if (ms1Importaciones.length) {
          const mapped = ms1Importaciones.map((i) => this.mapImportacion(i));
          this.embarques.set(mapped);
          this.embarqueMapaId.set(mapped[0].id);
          this.resumen.set(this.calcularResumenMs1(ms1Importaciones));
          this.proximas.set(this.calcularProximasMs1(ms1Importaciones));
          this.fuenteMs2.set(false);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  confirmarPlan(): void {
    if (this.planForm.invalid) return;
    this.planificando.set(true);
    this.planExito.set(null);
    this.planError.set(null);

    const body = this.planForm.getRawValue();
    this.ms2.planificarImportacion(body).subscribe({
      next: (res) => {
        this.planificando.set(false);
        this.planExito.set(
          `Se registraron ${res.creados} embarque(s) para ${body.marca} ${body.modelo} en etapa Comprado.`
        );
        this.mostrarPlan.set(false);
        void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
        this.cargarDatos();
      },
      error: () => {
        this.planificando.set(false);
        this.planError.set('No se pudo registrar el plan de importación. Verifica que MS-2 esté activo.');
      }
    });
  }

  cancelarPlan(): void {
    this.mostrarPlan.set(false);
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  irACotizador(): void {
    const { marca, modelo } = this.planForm.getRawValue();
    void this.router.navigate(['/cotizador'], {
      queryParams: { marca, modelo, tipoVehiculo: 'Pickup' }
    });
  }

  irAProveedores(): void {
    const { marca, modelo, cantidad } = this.planForm.getRawValue();
    void this.router.navigate(['/proveedores'], {
      queryParams: { from: 'plan', marca, modelo, cantidad }
    });
  }

  seleccionarEmbarque(id: string): void {
    this.embarqueMapaId.set(id);
  }

  limpiarFiltros(): void {
    this.search.set('');
    this.filterEtapa.set('TODAS');
    this.filterEstado.set('TODOS');
  }

  hayFiltrosActivos(): boolean {
    return (
      this.search().trim().length > 0 ||
      this.filterEtapa() !== 'TODAS' ||
      this.filterEstado() !== 'TODOS'
    );
  }

  avanzarEtapa(e: EmbarqueSeguimiento): void {
    if (!this.fuenteMs2() || e.etapaActual === 'EN_LOTE') return;
    this.avanzando.set(e.id);
    this.ms2.avanzarEmbarque(e.id).subscribe({
      next: (actualizado) => {
        this.embarques.update((list) =>
          list.map((item) => (item.id === actualizado.id ? actualizado : item))
        );
        this.ms2.getResumenImportaciones().subscribe((r) => this.resumen.set(r));
        this.avanzando.set(null);
      },
      error: () => this.avanzando.set(null)
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
      SOLICITADA: 'COMPRADO',
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

  private calcularResumenMs1(items: Importacion[]) {
    return {
      enTransito: items.filter((i) => ['SOLICITADA', 'EN_TRANSITO'].includes(i.estado)).length,
      enAduana: items.filter((i) => i.estado === 'EN_ADUANA').length,
      pendientePago: items.filter((i) => i.estado === 'LIBERADA').length,
      completadasMes: items.filter((i) => i.estado === 'COMPLETADA').length
    };
  }

  private calcularProximasMs1(items: Importacion[]) {
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

  abrirPagoSunca(imp: Importacion): void {
    this.suncaSeleccionada.set(imp);
    this.suncaError.set(null);
    this.suncaExito.set(null);
    this.impuestosSunca.set(null);
    this.suncaForm.reset({
      numeroDua: imp.numeroDua ?? `DUA-${imp.codigo}`,
      agenteAduanal: imp.agenteAduanal ?? '',
      comprobantePagoSunca: imp.comprobantePagoSunca ?? '',
      referenciaPoliza: imp.referenciaPoliza ?? ''
    });
    this.api.getImpuestosAduana(imp.id).subscribe({
      next: (calc) => this.impuestosSunca.set(calc),
      error: () => this.impuestosSunca.set(null)
    });
  }

  cerrarPagoSunca(): void {
    this.suncaSeleccionada.set(null);
    this.impuestosSunca.set(null);
    this.suncaError.set(null);
  }

  registrarPagoSunca(): void {
    const imp = this.suncaSeleccionada();
    if (!imp || this.suncaForm.invalid) {
      this.suncaForm.markAllAsTouched();
      return;
    }
    this.registrandoSunca.set(true);
    this.suncaError.set(null);
    const body = this.suncaForm.getRawValue();
    const calc = this.impuestosSunca();
    this.api
      .registrarPagoAduana(imp.id, {
        ...body,
        montoDai: calc?.montoDai,
        montoIsc: calc?.montoIsc,
        montoIvaAduana: calc?.montoIvaAduana
      })
      .subscribe({
        next: () => {
          this.registrandoSunca.set(false);
          this.suncaExito.set(`Pago SUNCA registrado para ${imp.codigo}`);
          this.cerrarPagoSunca();
          this.cargarDatos();
        },
        error: (err) => {
          this.registrandoSunca.set(false);
          this.suncaError.set(err?.error?.detail ?? 'No se pudo registrar el pago aduanero');
        }
      });
  }

  suncaEstadoClass(estado?: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'sunca-pendiente',
      PAGADO: 'sunca-pagado',
      LIBERADO: 'sunca-liberado'
    };
    return map[estado ?? 'PENDIENTE'] ?? 'sunca-pendiente';
  }
}
