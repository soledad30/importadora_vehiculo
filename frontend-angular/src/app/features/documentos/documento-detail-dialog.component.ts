import { Component, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  NbAlertModule,
  NbButtonModule,
  NbDialogRef,
  NbDialogService,
  NbIconModule,
  NbSpinnerModule
} from '@nebular/theme';
import { DocumentoDetalle } from '../../core/models/ms-extensions';
import { Ms3Service } from '../../core/services/ms3.service';
import { DocumentoEditDialogComponent } from './documento-edit-dialog.component';
import { DocumentoUploadDialogComponent } from './documento-upload-dialog.component';

@Component({
  selector: 'app-documento-detail-dialog',
  standalone: true,
  imports: [NbButtonModule, NbSpinnerModule, NbAlertModule, NbIconModule],
  templateUrl: './documento-detail-dialog.component.html',
  styleUrl: './documento-detail-dialog.component.scss'
})
export class DocumentoDetailDialogComponent implements OnInit, OnDestroy {
  private readonly ms3 = inject(Ms3Service);
  private readonly dialogRef = inject(NbDialogRef<DocumentoDetailDialogComponent>);
  private readonly dialog = inject(NbDialogService);
  private readonly sanitizer = inject(DomSanitizer);

  @Input() docId = 0;

  readonly loading = signal(true);
  readonly loadingPreview = signal(false);
  readonly avanzando = signal(false);
  readonly error = signal<string | null>(null);
  readonly doc = signal<DocumentoDetalle | null>(null);
  readonly previewUrl = signal<SafeResourceUrl | null>(null);

  private previewObjectUrl: string | null = null;
  private previewBlob: Blob | null = null;

  ngOnInit(): void {
    if (this.docId) {
      this.cargar(this.docId);
    } else {
      this.error.set('Documento no especificado');
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  cerrar(refresh = false): void {
    this.dialogRef.close(refresh);
  }

  descargarArchivo(): void {
    if (!this.previewBlob || !this.doc()) return;
    const link = document.createElement('a');
    link.href = this.previewObjectUrl ?? URL.createObjectURL(this.previewBlob);
    link.download = this.doc()!.nombre;
    link.click();
  }

  avanzar(): void {
    const d = this.doc();
    if (!d?.siguienteAccion) return;
    this.avanzando.set(true);
    this.error.set(null);
    this.ms3.avanzarDocumento(d.id).subscribe({
      next: (actualizado) => {
        this.doc.set(actualizado);
        this.avanzando.set(false);
      },
      error: (err) => {
        this.avanzando.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudo avanzar el documento');
      }
    });
  }

  subirArchivo(): void {
    const d = this.doc();
    if (!d) return;
    this.dialog
      .open(DocumentoUploadDialogComponent, {
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel',
        context: { docId: d.id, vehiculo: d.vehiculo, tipo: d.tipo }
      })
      .onClose.subscribe((saved) => {
        if (saved) {
          this.cargar(d.id);
          this.dialogRef.close(true);
        }
      });
  }

  editarDocumento(): void {
    const d = this.doc();
    if (!d) return;
    this.dialog
      .open(DocumentoEditDialogComponent, {
        closeOnBackdropClick: false,
        autoFocus: false,
        dialogClass: 'cliente-dialog-panel',
        context: { documento: d }
      })
      .onClose.subscribe((saved) => {
        if (saved) {
          this.cargar(d.id);
          this.dialogRef.close(true);
        }
      });
  }

  pasoCompletado(index: number, pasoActual: number): boolean {
    return index < pasoActual;
  }

  pasoActivo(index: number, pasoActual: number): boolean {
    return index === pasoActual;
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      VERIFICADO: 'Verificado',
      PENDIENTE: 'Pendiente',
      EN_REVISION: 'En Revisión'
    };
    return map[estado] ?? estado;
  }

  esPdf(nombre: string): boolean {
    return nombre.toLowerCase().endsWith('.pdf');
  }

  esImagen(nombre: string): boolean {
    return /\.(png|jpe?g|webp|gif)$/i.test(nombre);
  }

  private cargar(id: number): void {
    this.ms3.getDocumento(id).subscribe({
      next: (d) => {
        this.doc.set(d);
        this.loading.set(false);
        if (d.tieneArchivo) {
          this.cargarPreview(id);
        }
      },
      error: () => {
        this.error.set('No se pudo cargar el documento');
        this.loading.set(false);
      }
    });
  }

  private cargarPreview(id: number): void {
    this.loadingPreview.set(true);
    this.ms3.getDocumentoArchivo(id).subscribe({
      next: (blob) => {
        this.revokePreview();
        this.previewBlob = blob;
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl));
        this.loadingPreview.set(false);
      },
      error: () => {
        this.loadingPreview.set(false);
        this.error.set('No se pudo cargar la vista previa del archivo');
      }
    });
  }

  private revokePreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.previewBlob = null;
    this.previewUrl.set(null);
  }
}
