import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  NbButtonModule,
  NbCardModule,
  NbDialogService,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { forkJoin } from 'rxjs';
import { Proveedor } from '../../core/models/ms-extensions';
import { Ms2MockService } from '../../core/services/ms2-mock.service';
import { ProveedorFormDialogComponent } from './proveedor-form-dialog.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [NbCardModule, NbButtonModule, NbSpinnerModule, NbIconModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.scss'
})
export class ProveedoresComponent implements OnInit {
  private readonly ms2 = inject(Ms2MockService);
  private readonly dialog = inject(NbDialogService);

  readonly proveedores = signal<Proveedor[]>([]);
  readonly resumen = signal({ subastas: 0, navieras: 0, dealers: 0, agentes: 0 });
  readonly loading = signal(true);

  readonly subastas = computed(() => this.proveedores().filter((p) => p.tipo === 'SUBASTA'));
  readonly navieras = computed(() => this.proveedores().filter((p) => p.tipo === 'NAVIERA'));
  readonly agentes = computed(() => this.proveedores().filter((p) => p.tipo === 'AGENTE'));
  readonly dealers = computed(() => this.proveedores().filter((p) => p.tipo === 'DEALER'));

  ngOnInit(): void {
    forkJoin({
      proveedores: this.ms2.getProveedores(),
      resumen: this.ms2.getResumenProveedores()
    }).subscribe({
      next: ({ proveedores, resumen }) => {
        this.proveedores.set(proveedores);
        this.resumen.set(resumen);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.dialog
      .open(ProveedorFormDialogComponent, {
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => { if (saved) this.ngOnInit(); });
  }

  colorClass(color: string): string {
    return `color-${color}`;
  }
}
