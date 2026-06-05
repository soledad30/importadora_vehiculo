import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NbCardModule, NbIconModule, NbInputModule, NbSpinnerModule } from '@nebular/theme';
import { VehiculoBlockchain } from '../../core/models/ms-extensions';
import { Ms2MockService } from '../../core/services/ms2-mock.service';

@Component({
  selector: 'app-blockchain',
  standalone: true,
  imports: [FormsModule, NbCardModule, NbInputModule, NbSpinnerModule, NbIconModule],
  templateUrl: './blockchain.component.html',
  styleUrl: './blockchain.component.scss'
})
export class BlockchainComponent implements OnInit {
  private readonly ms2 = inject(Ms2MockService);

  readonly vehiculos = signal<VehiculoBlockchain[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.vehiculos();
    return this.vehiculos().filter((v) =>
      v.vin.toLowerCase().includes(q) || v.ultimoTxHash.toLowerCase().includes(q) ||
      v.titulo.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.ms2.getBlockchainHistorial().subscribe({
      next: (data) => { this.vehiculos.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  eventoClass(tipo: string): string {
    const map: Record<string, string> = {
      ORIGEN: 'node-origen', EMBARQUE: 'node-embarque', TRANSITO: 'node-transito',
      ADUANA: 'node-aduana', LIBERACION: 'node-liberacion', ENTREGA: 'node-entrega'
    };
    return map[tipo] ?? 'node-origen';
  }

  shortHash(hash: string): string {
    return hash.length > 14 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;
  }
}
