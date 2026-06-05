import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  CategoriaDocumento,
  DocumentoImportacion,
  InspeccionActiva,
  InspeccionReciente,
  ResumenDocumentos
} from '../models/ms-extensions';

/**
 * Datos mock de MS-3 (Nest.js + Python DL): OCR, verificación documental, inspección con IA.
 * Reemplazar por HttpClient → environment.ms3ApiUrl cuando el microservicio esté listo.
 */
@Injectable({ providedIn: 'root' })
export class Ms3MockService {
  private readonly latencyMs = 250;

  getResumenDocumentos(): Observable<ResumenDocumentos> {
    return of({ total: 156, pendientes: 12, porVencer: 8, verificados: 136 }).pipe(delay(this.latencyMs));
  }

  getCategoriasDocumentos(): Observable<CategoriaDocumento[]> {
    return of([
      { nombre: 'Titulos de Propiedad', cantidad: 23, icono: 'file-text-outline' },
      { nombre: 'Facturas Comerciales', cantidad: 45, icono: 'pricetags-outline' },
      { nombre: 'Bill of Lading (BL)', cantidad: 34, icono: 'globe-outline' },
      { nombre: 'Polizas de Importacion', cantidad: 28, icono: 'shield-outline' },
      { nombre: 'Permisos Fitosanitarios', cantidad: 12, icono: 'checkmark-circle-outline' },
      { nombre: 'Cartas de Porte', cantidad: 14, icono: 'car-outline' }
    ]).pipe(delay(this.latencyMs));
  }

  getDocumentos(): Observable<DocumentoImportacion[]> {
    return of<DocumentoImportacion[]>([
      { id: 1, nombre: 'TIT-2025-0034.pdf', vehiculo: 'Toyota RAV4 2024', tipo: 'Titulo', fecha: '2025-01-10', estado: 'VERIFICADO' },
      { id: 2, nombre: 'FAC-2025-0089.pdf', vehiculo: 'Honda CR-V 2023', tipo: 'Factura', fecha: '2025-01-09', estado: 'PENDIENTE' },
      { id: 3, nombre: 'BL-2025-0045.pdf', vehiculo: 'Nissan Rogue 2024', tipo: 'BL', fecha: '2025-01-08', estado: 'EN_REVISION' },
      { id: 4, nombre: 'POL-2025-0012.pdf', vehiculo: 'Mazda CX-5 2024', tipo: 'Poliza', fecha: '2025-01-07', estado: 'VERIFICADO' },
      { id: 5, nombre: 'TIT-2025-0021.pdf', vehiculo: 'Ford Explorer 2023', tipo: 'Titulo', fecha: '2025-01-06', estado: 'PENDIENTE' }
    ]).pipe(delay(this.latencyMs));
  }

  getInspeccionActiva(): Observable<InspeccionActiva> {
    return of({
      vehiculo: 'Toyota RAV4 2024',
      vin: '2T3P1RFV5RC123456',
      fecha: '2025-01-15',
      modeloDetectado: 'Toyota RAV4 XLE 2024',
      confianzaModelo: 98.7,
      danosDetectados: 2,
      severidad: 'Moderada',
      costoReparacion: 1200,
      danos: [
        { zona: 'Parachoques Frontal', tipo: 'Abolladura', severidad: 'Moderada', confianza: 96.2, reparacion: 800 },
        { zona: 'Puerta izquierda', tipo: 'Rayadura', severidad: 'Leve', confianza: 91.5, reparacion: 400 }
      ],
      ocr: {
        propietario: 'John Smith',
        vin: '2T3P1RFV5RC123456',
        estado: 'Texas, USA',
        fechaEmision: '2024-07-20',
        tipoTitulo: 'Clean Title'
      }
    }).pipe(delay(this.latencyMs));
  }

  getInspeccionesRecientes(): Observable<InspeccionReciente[]> {
    return of([
      { vehiculo: 'Honda CR-V 2023', resultado: 'Sin daños', fecha: '2025-01-14' },
      { vehiculo: 'Nissan Rogue 2024', resultado: '3 daños detectados', fecha: '2025-01-13' },
      { vehiculo: 'Mazda CX-5 2024', resultado: '1 daño leve', fecha: '2025-01-12' }
    ]).pipe(delay(this.latencyMs));
  }
}
