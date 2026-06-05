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
import { forkJoin } from 'rxjs';
import { DocumentoImportacion } from '../../core/models/ms-extensions';
import { Ms3MockService } from '../../core/services/ms3-mock.service';
import { DocumentoUploadDialogComponent } from './documento-upload-dialog.component';

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [FormsModule, NbCardModule, NbButtonModule, NbInputModule, NbSpinnerModule, NbAlertModule, NbIconModule],
  templateUrl: './documentos.component.html',
  styleUrl: './documentos.component.scss'
})
export class DocumentosComponent implements OnInit {
  private readonly ms3 = inject(Ms3MockService);
  private readonly dialog = inject(NbDialogService);

  readonly documentos = signal<DocumentoImportacion[]>([]);
  readonly categorias = signal<{ nombre: string; cantidad: number; icono: string }[]>([]);
  readonly resumen = signal({ total: 0, pendientes: 0, porVencer: 0, verificados: 0 });
  readonly loading = signal(true);
  readonly search = signal('');

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.documentos();
    return this.documentos().filter((d) =>
      [d.nombre, d.vehiculo, d.tipo].join(' ').toLowerCase().includes(q));
  });

  ngOnInit(): void {
    forkJoin({
      documentos: this.ms3.getDocumentos(),
      categorias: this.ms3.getCategoriasDocumentos(),
      resumen: this.ms3.getResumenDocumentos()
    }).subscribe({
      next: ({ documentos, categorias, resumen }) => {
        this.documentos.set(documentos);
        this.categorias.set(categorias);
        this.resumen.set(resumen);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openUpload(): void {
    this.dialog
      .open(DocumentoUploadDialogComponent, {
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel'
      })
      .onClose.subscribe((saved) => {
        if (saved) this.ngOnInit();
      });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      VERIFICADO: 'estado-verificado',
      PENDIENTE: 'estado-pendiente',
      EN_REVISION: 'estado-revision'
    };
    return map[estado] ?? '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      VERIFICADO: 'Verificado',
      PENDIENTE: 'Pendiente',
      EN_REVISION: 'En Revisión'
    };
    return map[estado] ?? estado;
  }
}
