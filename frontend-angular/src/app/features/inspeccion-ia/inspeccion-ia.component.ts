import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  NbButtonModule,
  NbCardModule,
  NbDialogService,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { forkJoin } from 'rxjs';
import { InspeccionActiva } from '../../core/models/ms-extensions';
import { Ms3MockService } from '../../core/services/ms3-mock.service';
import { InspeccionFormDialogComponent } from './inspeccion-form-dialog.component';

@Component({
  selector: 'app-inspeccion-ia',
  standalone: true,
  imports: [CurrencyPipe, NbCardModule, NbButtonModule, NbSpinnerModule, NbIconModule],
  templateUrl: './inspeccion-ia.component.html',
  styleUrl: './inspeccion-ia.component.scss'
})
export class InspeccionIaComponent implements OnInit {
  private readonly ms3 = inject(Ms3MockService);
  private readonly dialog = inject(NbDialogService);

  readonly activa = signal<InspeccionActiva | null>(null);
  readonly recientes = signal<{ vehiculo: string; resultado: string; fecha: string }[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    forkJoin({
      activa: this.ms3.getInspeccionActiva(),
      recientes: this.ms3.getInspeccionesRecientes()
    }).subscribe({
      next: ({ activa, recientes }) => {
        this.activa.set(activa);
        this.recientes.set(recientes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openNueva(): void {
    this.dialog
      .open(InspeccionFormDialogComponent, {
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => { if (saved) this.ngOnInit(); });
  }

  severidadClass(s: string): string {
    if (s === 'Leve') return 'text-leve';
    if (s === 'Moderada') return 'text-moderada';
    return 'text-severa';
  }
}
