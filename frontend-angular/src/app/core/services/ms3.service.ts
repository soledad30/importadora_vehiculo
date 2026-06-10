import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CategoriaDocumento,
  DocumentoDetalle,
  DocumentoImportacion,
  InspeccionActiva,
  InspeccionReciente,
  ReporteDocumentos,
  ReporteInspeccion,
  ResumenDocumentos
} from '../models/ms-extensions';

export interface FotosInspeccion360 {
  delante: File;
  detras: File;
  izquierda: File;
  derecha: File;
}

@Injectable({ providedIn: 'root' })
export class Ms3Service {
  private readonly base = environment.ms3ApiUrl;

  constructor(private readonly http: HttpClient) {}

  getResumenDocumentos(): Observable<ResumenDocumentos> {
    return this.http.get<ResumenDocumentos>(`${this.base}/documentos/resumen`);
  }

  getReporteDocumentos(): Observable<ReporteDocumentos> {
    return this.http.get<ReporteDocumentos>(`${this.base}/reportes/documentos`);
  }

  getReporteInspeccion(): Observable<ReporteInspeccion> {
    return this.http.get<ReporteInspeccion>(`${this.base}/reportes/inspeccion`);
  }

  getCategoriasDocumentos(): Observable<CategoriaDocumento[]> {
    return this.http.get<CategoriaDocumento[]>(`${this.base}/documentos/categorias`);
  }

  getDocumentos(): Observable<DocumentoImportacion[]> {
    return this.http.get<DocumentoImportacion[]>(`${this.base}/documentos`);
  }

  getDocumento(id: number): Observable<DocumentoDetalle> {
    return this.http.get<DocumentoDetalle>(`${this.base}/documentos/${id}`);
  }

  avanzarDocumento(id: number): Observable<DocumentoDetalle> {
    return this.http.post<DocumentoDetalle>(`${this.base}/documentos/${id}/avanzar`, {});
  }

  getDocumentoArchivo(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/documentos/${id}/archivo`, { responseType: 'blob' });
  }

  uploadDocumento(
    file: File,
    vehiculo: string,
    tipo: string,
    vin?: string
  ): Observable<DocumentoImportacion & { ocr?: unknown }> {
    const form = new FormData();
    form.append('file', file);
    form.append('vehiculo', vehiculo);
    form.append('tipo', tipo);
    if (vin) form.append('vin', vin);
    return this.http.post<DocumentoImportacion & { ocr?: unknown }>(`${this.base}/documentos/upload`, form);
  }

  actualizarDocumento(
    id: number,
    data: { nombre?: string; vehiculo?: string; tipo?: string; fecha?: string }
  ): Observable<DocumentoDetalle> {
    return this.http.patch<DocumentoDetalle>(`${this.base}/documentos/${id}`, data);
  }

  adjuntarArchivoDocumento(id: number, file: File, vin?: string): Observable<DocumentoDetalle> {
    const form = new FormData();
    form.append('file', file);
    if (vin) {
      form.append('vin', vin);
    }
    return this.http.post<DocumentoDetalle>(`${this.base}/documentos/${id}/archivo`, form);
  }

  getInspeccionActiva(): Observable<InspeccionActiva | null> {
    return this.http.get<InspeccionActiva>(`${this.base}/inspeccion/activa`).pipe(
      catchError((err) => (err.status === 404 ? of(null) : throwError(() => err)))
    );
  }

  getInspeccionesRecientes(): Observable<InspeccionReciente[]> {
    return this.http.get<InspeccionReciente[]>(`${this.base}/inspeccion/recientes`);
  }

  validarVistas360(fotos: FotosInspeccion360): Observable<{
    valido: boolean;
    consistenciaMinima: number;
    problemas: string[];
    calidadPorVista?: Record<string, { brillo: number; contraste: number; nitidez: number }>;
  }> {
    const form = new FormData();
    form.append('foto_delante', fotos.delante);
    form.append('foto_detras', fotos.detras);
    form.append('foto_izquierda', fotos.izquierda);
    form.append('foto_derecha', fotos.derecha);
    return this.http.post<{
      valido: boolean;
      consistenciaMinima: number;
      problemas: string[];
      calidadPorVista?: Record<string, { brillo: number; contraste: number; nitidez: number }>;
    }>(`${this.base}/inspeccion/validar-vistas`, form);
  }

  analizarInspeccion360(
    fotos: FotosInspeccion360,
    vin: string,
    vehiculo = '',
    documento?: File | null
  ): Observable<InspeccionActiva> {
    const form = new FormData();
    form.append('foto_delante', fotos.delante);
    form.append('foto_detras', fotos.detras);
    form.append('foto_izquierda', fotos.izquierda);
    form.append('foto_derecha', fotos.derecha);
    form.append('vin', vin);
    form.append('vehiculo', vehiculo);
    if (documento) {
      form.append('documento', documento);
    }
    return this.http.post<InspeccionActiva>(`${this.base}/inspeccion/analizar`, form);
  }

  /** Una sola foto — flujo legacy (p. ej. desde Pedidos vía MS-1). */
  analizarInspeccion(
    file: File,
    vin: string,
    vehiculo = '',
    documento?: File | null
  ): Observable<InspeccionActiva> {
    const form = new FormData();
    form.append('file', file);
    form.append('vin', vin);
    form.append('vehiculo', vehiculo);
    if (documento) {
      form.append('documento', documento);
    }
    return this.http.post<InspeccionActiva>(`${this.base}/inspeccion/analizar`, form);
  }
}
