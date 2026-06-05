import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbDialogService,
  NbIconModule,
  NbInputModule,
  NbSpinnerModule
} from '@nebular/theme';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Vendedor, VendedorResumen } from '../../core/models';
import {
  VendedorDialogContext,
  VendedorFormDialogComponent
} from './vendedor-form-dialog.component';

@Component({
  selector: 'app-vendedores',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    NbCardModule,
    NbButtonModule,
    NbInputModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule
  ],
  templateUrl: './vendedores.component.html',
  styleUrl: './vendedores.component.scss'
})
export class VendedoresComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(NbDialogService);
  private readonly auth = inject(AuthService);

  readonly items = signal<Vendedor[]>([]);
  readonly resumen = signal<VendedorResumen | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly togglingId = signal<number | null>(null);

  readonly isAdmin = computed(() => this.auth.rol() === 'ADMIN');

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter((v) => {
      const haystack = [v.codigo, v.nombreCompleto, v.telefono, v.email, v.zonaAsignada]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getVendedores().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudo cargar vendedores');
      }
    });
    this.api.getVendedorResumen().subscribe({
      next: (data) => this.resumen.set(data),
      error: () => this.resumen.set(null)
    });
  }

  openCreate(): void {
    this.openDialog({ mode: 'create' });
  }

  openView(v: Vendedor): void {
    this.openDialog({ mode: 'view', vendedor: v });
  }

  codigoDisplay(v: Vendedor): string {
    return v.codigo ? `#${v.codigo}` : `#VEN-${String(v.id).padStart(3, '0')}`;
  }

  toggleActivo(v: Vendedor): void {
    if (!this.isAdmin()) return;
    this.togglingId.set(v.id);
    this.error.set(null);
    this.api.toggleVendedorActivo(v.id).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.togglingId.set(null);
        this.api.getVendedorResumen().subscribe({
          next: (data) => this.resumen.set(data),
          error: () => undefined
        });
      },
      error: (err) => {
        this.togglingId.set(null);
        this.error.set(err?.error?.detail ?? 'No se pudo cambiar el estado del vendedor');
      }
    });
  }

  formatCompact(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${Math.round(value)}`;
  }

  private openDialog(ctx: VendedorDialogContext): void {
    this.dialog
      .open(VendedorFormDialogComponent, {
        context: {
          mode: ctx.mode,
          vendedor: ctx.vendedor
        },
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.load();
      });
  }
}
