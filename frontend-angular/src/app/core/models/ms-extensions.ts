/** Tipos para módulos que consumirán MS-2 (ML/logística) y MS-3 (DL/OCR/IA). */

export type EtapaEmbarque =
  | 'COMPRADO'
  | 'EMBARCADO'
  | 'EN_TRANSITO'
  | 'EN_ADUANA'
  | 'LIBERADO'
  | 'EN_LOTE';

export type EstadoEmbarqueBadge = 'EN_TRANSITO' | 'EN_ADUANA' | 'LIBERADO' | 'COMPLETADO';

export interface EmbarqueSeguimiento {
  id: string;
  codigo: string;
  vehiculo: string;
  referencia: string;
  origen: string;
  destino: string;
  naviera: string;
  estadoBadge: EstadoEmbarqueBadge;
  etapaActual: EtapaEmbarque;
  etapas: EtapaEmbarque[];
}

export interface ResumenImportacionesActivas {
  enTransito: number;
  enAduana: number;
  pendientePago: number;
  completadasMes: number;
}

export interface ProximaLlegada {
  codigo: string;
  vehiculo: string;
  fecha: string;
  diasRestantes: number;
}

export type EstadoDocumento = 'VERIFICADO' | 'PENDIENTE' | 'EN_REVISION';

export interface DocumentoImportacion {
  id: number;
  nombre: string;
  vehiculo: string;
  tipo: string;
  fecha: string;
  estado: EstadoDocumento;
}

export interface CategoriaDocumento {
  nombre: string;
  cantidad: number;
  icono: string;
}

export interface ResumenDocumentos {
  total: number;
  pendientes: number;
  porVencer: number;
  verificados: number;
}

export type TipoEventoBlockchain =
  | 'ORIGEN'
  | 'EMBARQUE'
  | 'TRANSITO'
  | 'ADUANA'
  | 'LIBERACION'
  | 'ENTREGA';

export interface EventoBlockchain {
  fecha: string;
  titulo: string;
  detalle: string;
  tipo: TipoEventoBlockchain;
}

export interface VehiculoBlockchain {
  titulo: string;
  vin: string;
  blockchainId: string;
  red: string;
  eventos: EventoBlockchain[];
  ultimoTxHash: string;
  block: string;
  gas: string;
  confirmaciones: number;
}

export interface CotizacionReciente {
  vehiculo: string;
  cif: number;
  impuestos: number;
  total: number;
  margen: number;
  venta: number;
}

export interface DesgloseCotizacion {
  precioFob: number;
  fleteMaritimo: number;
  seguro: number;
  valorCif: number;
  dai: number;
  isc: number;
  iva: number;
  atp: number;
  transporteInterno: number;
  tramitesAduaneros: number;
  costoTotal: number;
  margenPorcentaje: number;
  precioSugeridoVenta: number;
}

export type TipoProveedor = 'SUBASTA' | 'NAVIERA' | 'DEALER' | 'AGENTE';

export interface Proveedor {
  id: number;
  nombre: string;
  tipo: TipoProveedor;
  detalle: string;
  metrica: string;
  color: 'blue' | 'orange' | 'green' | 'purple';
}

export interface ResumenProveedores {
  subastas: number;
  navieras: number;
  dealers: number;
  agentes: number;
}

export interface DanoDetectado {
  zona: string;
  tipo: string;
  severidad: string;
  confianza: number;
  reparacion: number;
}

export interface InspeccionActiva {
  vehiculo: string;
  vin: string;
  fecha: string;
  modeloDetectado: string;
  confianzaModelo: number;
  danosDetectados: number;
  severidad: string;
  costoReparacion: number;
  danos: DanoDetectado[];
  ocr: {
    propietario: string;
    vin: string;
    estado: string;
    fechaEmision: string;
    tipoTitulo: string;
  };
}

export interface InspeccionReciente {
  vehiculo: string;
  resultado: string;
  fecha: string;
}
