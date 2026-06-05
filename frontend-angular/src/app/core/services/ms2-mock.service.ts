import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  CotizacionReciente,
  DesgloseCotizacion,
  EmbarqueSeguimiento,
  ProximaLlegada,
  Proveedor,
  ResumenImportacionesActivas,
  ResumenProveedores,
  VehiculoBlockchain
} from '../models/ms-extensions';

/**
 * Datos mock de MS-2 (Django/ML): seguimiento logístico, cotizador, proveedores, blockchain.
 * Reemplazar llamadas por HttpClient → environment.ms2ApiUrl cuando el microservicio esté listo.
 */
@Injectable({ providedIn: 'root' })
export class Ms2MockService {
  private readonly latencyMs = 200;

  getEmbarques(): Observable<EmbarqueSeguimiento[]> {
    return of<EmbarqueSeguimiento[]>([
      {
        id: '1',
        codigo: 'IMP-2025-0034',
        vehiculo: 'Toyota RAV4 XLE 2024',
        referencia: 'VIN: 2T3P1RFV5RC123456',
        origen: 'Miami, FL',
        destino: 'Corinto, NI',
        naviera: 'Evergreen',
        estadoBadge: 'EN_TRANSITO',
        etapaActual: 'EN_TRANSITO',
        etapas: ['COMPRADO', 'EMBARCADO', 'EN_TRANSITO', 'EN_ADUANA', 'LIBERADO', 'EN_LOTE']
      },
      {
        id: '2',
        codigo: 'IMP-2025-0028',
        vehiculo: 'Honda CR-V EX 2023',
        referencia: 'Contenedor: EGLU4523891',
        origen: 'Houston, TX',
        destino: 'Puerto Cortés, HN',
        naviera: 'Maersk',
        estadoBadge: 'EN_ADUANA',
        etapaActual: 'EN_ADUANA',
        etapas: ['COMPRADO', 'EMBARCADO', 'EN_TRANSITO', 'EN_ADUANA', 'LIBERADO', 'EN_LOTE']
      },
      {
        id: '3',
        codigo: 'IMP-2025-0019',
        vehiculo: 'Nissan Rogue SV 2024',
        referencia: 'BL: EGLV089234',
        origen: 'Los Angeles, CA',
        destino: 'Corinto, NI',
        naviera: 'MSC',
        estadoBadge: 'LIBERADO',
        etapaActual: 'LIBERADO',
        etapas: ['COMPRADO', 'EMBARCADO', 'EN_TRANSITO', 'EN_ADUANA', 'LIBERADO', 'EN_LOTE']
      }
    ]).pipe(delay(this.latencyMs));
  }

  getResumenImportaciones(): Observable<ResumenImportacionesActivas> {
    return of({
      enTransito: 12,
      enAduana: 5,
      pendientePago: 3,
      completadasMes: 28
    }).pipe(delay(this.latencyMs));
  }

  getProximasLlegadas(): Observable<ProximaLlegada[]> {
    return of([
      { codigo: 'IMP-0034', vehiculo: 'Toyota RAV4', fecha: '2025-02-08', diasRestantes: 3 },
      { codigo: 'IMP-0028', vehiculo: 'Honda CR-V', fecha: '2025-02-12', diasRestantes: 7 },
      { codigo: 'IMP-0019', vehiculo: 'Nissan Rogue', fecha: '2025-02-15', diasRestantes: 10 }
    ]).pipe(delay(this.latencyMs));
  }

  getBlockchainHistorial(vin?: string): Observable<VehiculoBlockchain[]> {
    void vin;
    return of<VehiculoBlockchain[]>([
      {
        titulo: 'Toyota RAV4 2024',
        vin: '2T3P1RFV5RC123456',
        blockchainId: '0x7a3f...8b2c',
        red: 'Ethereum',
        eventos: [
          { fecha: '2024-08-15', titulo: 'ORIGEN - Compra en Subasta', detalle: 'Copart Dallas, TX - Lote #45892301', tipo: 'ORIGEN' },
          { fecha: '2024-08-22', titulo: 'EMBARQUE - Puerto de Salida', detalle: 'Puerto Houston, TX - BL: EGLV089234', tipo: 'EMBARQUE' },
          { fecha: '2024-09-10', titulo: 'TRANSITO - En Alta Mar', detalle: 'Naviera: Evergreen - Contenedor: EGLU4523891', tipo: 'TRANSITO' },
          { fecha: '2024-10-02', titulo: 'ADUANA - Llegada a Puerto', detalle: 'Puerto Cortés, Honduras - DUA: 2024-HC-08923', tipo: 'ADUANA' },
          { fecha: '2024-10-10', titulo: 'LIBERACION - Despacho Aduanero', detalle: 'Agente: Cargo Express - Póliza: POL-2024-4521', tipo: 'LIBERACION' },
          { fecha: '2024-10-15', titulo: 'ENTREGA - En Lote de Venta', detalle: 'AutoImport Pro - Lote Central, San Pedro Sula', tipo: 'ENTREGA' }
        ],
        ultimoTxHash: '0x7a3f8e2b1c9d4f6a8e0b2c4d6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4',
        block: '#18,234,567',
        gas: '0.0023 ETH',
        confirmaciones: 847
      }
    ]).pipe(delay(this.latencyMs));
  }

  calcularCotizacion(input: {
    precioCompra: number;
    paisOrigen: string;
    puertoEmbarque: string;
    puertoDestino: string;
    tipoVehiculo: string;
    anio: number;
    cilindrada: number;
    peso: number;
  }): Observable<DesgloseCotizacion> {
    const flete = 1850;
    const seguro = input.precioCompra * 0.015;
    const cif = input.precioCompra + flete + seguro;
    const dai = cif * 0.15;
    const isc = cif * 0.1;
    const iva = (cif + dai + isc) * 0.15;
    const atp = cif * 0.01;
    const transporte = 450;
    const tramites = 380;
    const total = cif + dai + isc + iva + atp + transporte + tramites;
    const margen = 30;
    return of({
      precioFob: input.precioCompra,
      fleteMaritimo: flete,
      seguro,
      valorCif: cif,
      dai,
      isc,
      iva,
      atp,
      transporteInterno: transporte,
      tramitesAduaneros: tramites,
      costoTotal: Math.round(total * 100) / 100,
      margenPorcentaje: margen,
      precioSugeridoVenta: Math.round(total * 1.3 * 100) / 100
    }).pipe(delay(this.latencyMs));
  }

  getCotizacionesRecientes(): Observable<CotizacionReciente[]> {
    return of([
      { vehiculo: 'Toyota RAV4 2024', cif: 13887, impuestos: 6454, total: 22479, margen: 30, venta: 29223 },
      { vehiculo: 'Honda CR-V 2023', cif: 12450, impuestos: 5780, total: 20120, margen: 28, venta: 25754 },
      { vehiculo: 'Nissan Rogue 2024', cif: 13100, impuestos: 6100, total: 21350, margen: 30, venta: 27755 }
    ]).pipe(delay(this.latencyMs));
  }

  getProveedores(): Observable<Proveedor[]> {
    return of<Proveedor[]>([
      { id: 1, nombre: 'Copart', tipo: 'SUBASTA', detalle: 'Dallas, TX | Houston, TX', metrica: '2,340 compras', color: 'blue' },
      { id: 2, nombre: 'IAAI', tipo: 'SUBASTA', detalle: 'Miami, FL | Atlanta, GA', metrica: '1,890 compras', color: 'orange' },
      { id: 3, nombre: 'Manheim', tipo: 'SUBASTA', detalle: 'Los Angeles, CA', metrica: '980 compras', color: 'green' },
      { id: 4, nombre: 'Evergreen', tipo: 'NAVIERA', detalle: 'Houston > Puerto Cortés', metrica: '18-22 días', color: 'blue' },
      { id: 5, nombre: 'Maersk', tipo: 'NAVIERA', detalle: 'Miami > Corinto', metrica: '20-25 días', color: 'orange' },
      { id: 6, nombre: 'MSC', tipo: 'NAVIERA', detalle: 'LA > Puerto Cortés', metrica: '22-28 días', color: 'green' },
      { id: 7, nombre: 'Cargo Express S.A.', tipo: 'AGENTE', detalle: 'Puerto Cortés', metrica: '156 despachos', color: 'blue' },
      { id: 8, nombre: 'Aduanas del Norte', tipo: 'AGENTE', detalle: 'Corinto', metrica: '98 despachos', color: 'orange' },
      { id: 9, nombre: 'Global Customs HN', tipo: 'AGENTE', detalle: 'San Pedro Sula', metrica: '72 despachos', color: 'green' },
      { id: 10, nombre: 'AutoNation Dealer', tipo: 'DEALER', detalle: 'Texas, USA', metrica: '420 vehículos', color: 'purple' },
      { id: 11, nombre: 'CarMax Export', tipo: 'DEALER', detalle: 'Florida, USA', metrica: '310 vehículos', color: 'blue' },
      { id: 12, nombre: 'DriveTime Wholesale', tipo: 'DEALER', detalle: 'California, USA', metrica: '185 vehículos', color: 'green' }
    ]).pipe(delay(this.latencyMs));
  }

  getResumenProveedores(): Observable<ResumenProveedores> {
    return of({ subastas: 8, navieras: 5, dealers: 12, agentes: 3 }).pipe(delay(this.latencyMs));
  }
}
