import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CotizacionReciente,
  DesgloseCotizacion,
  EmbarqueSeguimiento,
  RastreoNaviero,
  ProximaLlegada,
  Proveedor,
  ResumenImportacionesActivas,
  ResumenProveedores,
  VehiculoBlockchain
} from '../models/ms-extensions';

@Injectable({ providedIn: 'root' })
export class Ms2Service {
  private readonly base = environment.ms2ApiUrl;

  constructor(private readonly http: HttpClient) {}

  getEmbarques(): Observable<EmbarqueSeguimiento[]> {
    return this.http.get<EmbarqueSeguimiento[]>(`${this.base}/embarques`);
  }

  getResumenImportaciones(): Observable<ResumenImportacionesActivas> {
    return this.http.get<ResumenImportacionesActivas>(`${this.base}/importaciones/resumen`);
  }

  getProximasLlegadas(): Observable<ProximaLlegada[]> {
    return this.http.get<ProximaLlegada[]>(`${this.base}/importaciones/proximas-llegadas`);
  }

  getBlockchainHistorial(params?: {
    vin?: string;
    tipo?: string;
    desde?: string;
    hasta?: string;
    red?: string;
    estado?: string;
  }): Observable<VehiculoBlockchain[]> {
    const q = new URLSearchParams();
    if (params?.vin) q.set('vin', params.vin);
    if (params?.tipo && params.tipo !== 'TODOS') q.set('tipo', params.tipo);
    if (params?.desde) q.set('desde', params.desde);
    if (params?.hasta) q.set('hasta', params.hasta);
    if (params?.red && params.red !== 'TODOS') q.set('red', params.red);
    if (params?.estado && params.estado !== 'TODOS') q.set('estado', params.estado);
    const qs = q.toString();
    const url = `${this.base}/blockchain${qs ? `?${qs}` : ''}`;
    return this.http.get<VehiculoBlockchain[]>(url);
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
    return this.http.post<DesgloseCotizacion>(`${this.base}/cotizador/calcular`, input);
  }

  getCotizacionesRecientes(): Observable<CotizacionReciente[]> {
    return this.http.get<CotizacionReciente[]>(`${this.base}/cotizador/recientes`);
  }

  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.base}/proveedores`);
  }

  getResumenProveedores(): Observable<ResumenProveedores> {
    return this.http.get<ResumenProveedores>(`${this.base}/proveedores/resumen`);
  }

  getPrediccionDemanda(meses = 3): Observable<{
    horizonteMeses: number;
    totalProyectado: number;
    marcas: { marca: string; demandaProyectada: number; recomendacion: string }[];
  }> {
    return this.http.get<{
      horizonteMeses: number;
      totalProyectado: number;
      marcas: { marca: string; demandaProyectada: number; recomendacion: string }[];
    }>(`${this.base}/ml/prediccion-demanda`, { params: { meses } });
  }

  getAnalisisHistorico(): Observable<{
    resumen: { vehiculosDisponibles: number; pedidosTotales: number; ticketPromedio: number };
    tendencia: string;
    serieMensual: { mes: string; pedidos: number; ventas: number }[];
  }> {
    return this.http.get<{
      resumen: { vehiculosDisponibles: number; pedidosTotales: number; ticketPromedio: number };
      tendencia: string;
      serieMensual: { mes: string; pedidos: number; ventas: number }[];
    }>(`${this.base}/ml/analisis-historico`);
  }

  getAnomalias(): Observable<{ totalAnomalias: number; anomalias: unknown[] }> {
    return this.http.get<{ totalAnomalias: number; anomalias: unknown[] }>(`${this.base}/ml/anomalias`);
  }

  getSegmentacionClientes(): Observable<{
    totalClientes: number;
    segmentos: { cluster: number; cantidad: number; ticketPromedio: number; etiqueta: string }[];
  }> {
    return this.http.get<{
      totalClientes: number;
      segmentos: { cluster: number; cantidad: number; ticketPromedio: number; etiqueta: string }[];
    }>(`${this.base}/ml/segmentacion-clientes`);
  }

  planificarImportacion(body: {
    marca: string;
    modelo: string;
    cantidad: number;
    origen?: string;
    destino?: string;
    naviera?: string;
  }): Observable<{ creados: number; embarques: EmbarqueSeguimiento[] }> {
    return this.http.post<{ creados: number; embarques: EmbarqueSeguimiento[] }>(
      `${this.base}/embarques/planificar`,
      body
    );
  }

  avanzarEmbarque(embarqueId: string): Observable<EmbarqueSeguimiento> {
    return this.http.post<EmbarqueSeguimiento>(`${this.base}/embarques/${embarqueId}/avanzar`, {});
  }

  getRastreoEmbarque(embarqueId: string): Observable<RastreoNaviero> {
    return this.http.get<RastreoNaviero>(`${this.base}/embarques/${embarqueId}/rastreo`);
  }
}
