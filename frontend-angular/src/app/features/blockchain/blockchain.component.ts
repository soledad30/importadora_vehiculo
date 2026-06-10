import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { TipoEventoBlockchain, VehiculoBlockchain } from '../../core/models/ms-extensions';
import { Ms2Service } from '../../core/services/ms2.service';

type FiltroEstado = 'TODOS' | 'COMPLETA' | 'EN_PROCESO';

@Component({
  selector: 'app-blockchain',
  standalone: true,
  imports: [
    FormsModule,
    NbCardModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    NbButtonModule,
    NbSpinnerModule,
    NbIconModule,
    NbAlertModule
  ],
  templateUrl: './blockchain.component.html',
  styleUrl: './blockchain.component.scss'
})
export class BlockchainComponent implements OnInit {
  private readonly ms2 = inject(Ms2Service);

  readonly vehiculos = signal<VehiculoBlockchain[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showAyuda = signal(true);

  readonly search = signal('');
  readonly filtroTipo = signal<string>('TODOS');
  readonly filtroRed = signal<string>('TODOS');
  readonly filtroEstado = signal<FiltroEstado>('TODOS');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');

  readonly tiposEvento: { value: string; label: string }[] = [
    { value: 'TODOS', label: 'Todos los eventos' },
    { value: 'ORIGEN', label: 'Origen (compra)' },
    { value: 'EMBARQUE', label: 'Embarque' },
    { value: 'TRANSITO', label: 'Tránsito marítimo' },
    { value: 'ADUANA', label: 'Aduana' },
    { value: 'LIBERACION', label: 'Liberación' },
    { value: 'ENTREGA', label: 'Entrega final' }
  ];

  readonly redes = ['TODOS', 'Ethereum', 'Polygon'];

  readonly estadosCustodia: { value: FiltroEstado; label: string }[] = [
    { value: 'TODOS', label: 'Todas las custodias' },
    { value: 'COMPLETA', label: 'Cadena completa (con entrega)' },
    { value: 'EN_PROCESO', label: 'En tránsito / incompleta' }
  ];

  readonly resumen = computed(() => {
    const list = this.vehiculos();
    const eventos = list.reduce((acc, v) => acc + v.eventos.length, 0);
    const completas = list.filter((v) => this.esCadenaCompleta(v)).length;
    return { vehiculos: list.length, eventos, completas };
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ms2
      .getBlockchainHistorial({
        vin: this.search().trim() || undefined,
        tipo: this.filtroTipo(),
        desde: this.fechaDesde() || undefined,
        hasta: this.fechaHasta() || undefined,
        red: this.filtroRed(),
        estado: this.filtroEstado()
      })
      .subscribe({
        next: (data) => {
          this.vehiculos.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudo cargar el historial blockchain (MS-2).');
        }
      });
  }

  aplicarFiltros(): void {
    this.cargar();
  }

  limpiarFiltros(): void {
    this.search.set('');
    this.filtroTipo.set('TODOS');
    this.filtroRed.set('TODOS');
    this.filtroEstado.set('TODOS');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.cargar();
  }

  esCadenaCompleta(v: VehiculoBlockchain): boolean {
    return v.eventos.some((e) => e.tipo === 'ENTREGA');
  }

  badgeEstado(v: VehiculoBlockchain): { label: string; class: string } {
    if (this.esCadenaCompleta(v) && v.confirmaciones >= 100) {
      return { label: 'Verificado', class: 'badge-verificado' };
    }
    if (this.esCadenaCompleta(v)) {
      return { label: 'Completo', class: 'badge-completo' };
    }
    return { label: 'En tránsito', class: 'badge-proceso' };
  }

  eventoClass(tipo: string): string {
    const map: Record<string, string> = {
      ORIGEN: 'node-origen',
      EMBARQUE: 'node-embarque',
      TRANSITO: 'node-transito',
      ADUANA: 'node-aduana',
      LIBERACION: 'node-liberacion',
      ENTREGA: 'node-entrega'
    };
    return map[tipo] ?? 'node-origen';
  }

  eventoLabel(tipo: TipoEventoBlockchain | string): string {
    return this.tiposEvento.find((t) => t.value === tipo)?.label ?? tipo;
  }

  shortHash(hash: string): string {
    return hash.length > 14 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;
  }

  toggleAyuda(): void {
    this.showAyuda.update((v) => !v);
  }
}
