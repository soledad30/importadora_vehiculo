export type RolUsuario = 'ADMIN' | 'VENDEDOR' | 'CLIENTE';

export type { AuthConfig } from './auth-config';

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEn: number;
  username: string;
  rol: RolUsuario;
  clienteId?: number | null;
  clienteNombre?: string | null;
}

export interface Vehiculo {
  id: number;
  vin: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  precio: number;
  estado: string;
  imagenUrl?: string | null;
  loteId?: number | null;
  loteCodigo?: string | null;
  paisOrigen?: string;
  esImportado?: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export type TipoCliente = 'VIP' | 'REGULAR' | 'NUEVO';

export interface Cliente {
  id: number;
  codigo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  notas?: string;
  tipoCliente: TipoCliente;
  activo: boolean;
  vendedorAsignadoId?: number | null;
  vendedorAsignadoUsername?: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ClienteCreateRequest {
  nombreCompleto: string;
  email: string;
  telefono?: string;
  cedulaRuc: string;
  direccion?: string;
  ciudad?: string;
  tipoCliente: TipoCliente;
  notas?: string;
}

export interface MiPerfil {
  usuarioId: number;
  username: string;
  email: string;
  rol: RolUsuario;
  cliente?: Cliente | null;
  vendedor?: Vendedor | null;
}

export interface MiPerfilUpdateRequest {
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  zonaAsignada?: string;
}

export interface CambioContrasenaRequest {
  contrasenaActual: string;
  contrasenaNueva: string;
}

export type EstadoPedido =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_IMPORTACION'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface Pedido {
  id: number;
  codigo: string;
  clienteId: number;
  clienteNombre: string;
  clienteNumeroDocumento?: string;
  vehiculoId: number;
  vehiculoDescripcion: string;
  vehiculoTitulo: string;
  vehiculoImagenUrl?: string | null;
  vehiculoVin?: string;
  vendedorId?: number;
  vendedorUsername?: string;
  estado: EstadoPedido;
  precioBase: number;
  impuestos: number;
  envio: number;
  total: number;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface PedidoCreateRequest {
  clienteId: number;
  vehiculoId: number;
  vendedorId?: number;
  notas?: string;
  impuestos?: number;
  envio?: number;
}

export interface Importacion {
  id: number;
  codigo: string;
  pedidoId: number;
  pedidoCodigo?: string;
  vehiculoId?: number;
  vehiculoVin?: string;
  vehiculoTitulo?: string;
  paisOrigen: string;
  aduana: string;
  puertoOrigen?: string;
  puertoDestino?: string;
  naviera?: string;
  numeroBl?: string;
  numeroContenedor?: string;
  numeroDespacho?: string;
  ms2EmbarqueId?: string;
  estado: string;
  fechaInicio: string;
  fechaEstimadaEntrega?: string;
  numeroDua?: string;
  agenteAduanal?: string;
  montoDai?: number;
  montoIsc?: number;
  montoIvaAduana?: number;
  montoTotalImpuestos?: number;
  estadoPagoAduana?: 'PENDIENTE' | 'PAGADO' | 'LIBERADO';
  comprobantePagoSunca?: string;
  fechaPagoAduana?: string;
  referenciaPoliza?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ImpuestosAduana {
  importacionId: number;
  codigo: string;
  valorCif: number;
  montoDai: number;
  montoIsc: number;
  montoIvaAduana: number;
  montoTotalImpuestos: number;
}

export interface PagoAduanaRequest {
  numeroDua: string;
  agenteAduanal: string;
  comprobantePagoSunca: string;
  referenciaPoliza?: string;
  montoDai?: number;
  montoIsc?: number;
  montoIvaAduana?: number;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: RolUsuario;
  clienteId?: number;
  clienteNombre?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface UsuarioCreate {
  username: string;
  password: string;
  email: string;
  rol: RolUsuario;
  clienteId?: number;
}

export interface Factura {
  id: number;
  pedidoId: number;
  pedidoCodigo?: string;
  numeroFactura: string;
  monto: number;
  subtotal?: number;
  isv?: number;
  cai?: string;
  rtnEmisor?: string;
  rtnCliente?: string;
  metodoPago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE';
  estado: string;
  fechaEmision: string;
  clienteId?: number;
  clienteNombre?: string;
  clienteDocumento?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  clienteDireccion?: string;
  clienteCiudad?: string;
  vendedorNombre?: string;
  vendedorCodigo?: string;
  vendedorTelefono?: string;
  vendedorEmail?: string;
  vehiculoTitulo?: string;
  vehiculoVin?: string;
  vehiculoMarca?: string;
  vehiculoModelo?: string;
  vehiculoAnio?: number;
  vehiculoColor?: string;
  vehiculoPaisOrigen?: string;
  precioBase?: number;
  impuestos?: number;
  envio?: number;
  total?: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Vendedor {
  id: number;
  codigo: string;
  usuarioId: number;
  nombreCompleto: string;
  telefono: string;
  email: string;
  cedula: string;
  zonaAsignada?: string;
  fechaIngreso?: string;
  metaMensual?: number;
  comisionPorcentaje: number;
  ventasTotales: number;
  activo: boolean;
  enCampo: boolean;
  creadoEn: string;
}

export interface VendedorCreateRequest {
  nombreCompleto: string;
  email: string;
  telefono: string;
  cedula: string;
  zonaAsignada?: string;
  fechaIngreso?: string;
  metaMensual?: number;
  comisionPorcentaje: number;
  password?: string;
}

export interface VendedorResumen {
  totalVendedores: number;
  activos: number;
  enCampo: number;
  ventasEquipo: number;
}

export type CategoriaNotificacion =
  | 'STOCK'
  | 'VEHICULO'
  | 'IMPORTACION'
  | 'DOCUMENTO'
  | 'CLIENTE'
  | 'PEDIDO'
  | 'FACTURA'
  | 'SISTEMA'
  | 'BLOCKCHAIN'
  | 'PROVEEDOR'
  | 'PREDICCION';

export type NivelNotificacion = 'INFO' | 'EXITO' | 'ADVERTENCIA' | 'CRITICO';

export interface NotificacionItem {
  id: number;
  categoria: CategoriaNotificacion;
  nivel: NivelNotificacion;
  titulo: string;
  mensaje: string;
  referenciaTipo?: string | null;
  referenciaId?: number | null;
  flujo?: string | null;
  leida: boolean;
  creadoEn: string;
}

export interface ReporteResumen {
  ventasTotales: number;
  ventasMesActual: number;
  pedidosPendientes: number;
  pedidosEnProceso: number;
  pedidosCompletados: number;
  vehiculosDisponibles: number;
  vehiculosVendidos: number;
  clientesActivos: number;
  importacionesActivas: number;
  facturasEmitidas: number;
  topVendedores: {
    codigo: string;
    nombreCompleto: string;
    ventasTotales: number;
    comisionPorcentaje: number;
  }[];
}

export interface ReporteImportaciones {
  totalActivas: number;
  totalCompletadas: number;
  pedidosConfirmadosSinImportacion: number;
  importacionesRetrasadas: number;
  promedioDiasEnProceso: number;
  pipeline: {
    estado: string;
    etiqueta: string;
    cantidad: number;
  }[];
  alertas: {
    codigo: string;
    vehiculo: string;
    cliente: string;
    estado: string;
    diasEnProceso: number;
    fechaEstimadaEntrega: string;
    puertoDestino: string;
  }[];
}

export interface ReporteFinanzas {
  facturasEmitidas: number;
  facturasPagadas: number;
  facturasBorrador: number;
  facturasAnuladas: number;
  montoPorCobrar: number;
  montoCobrado: number;
  montoTotalFacturado: number;
  pendientesCobro: {
    numeroFactura: string;
    cliente: string;
    vehiculo: string;
    monto: number;
    fechaEmision: string;
    diasDesdeEmision: number;
  }[];
}

export type EstadoLote =
  | 'PLANIFICADO'
  | 'EMBARCADO'
  | 'EN_TRANSITO'
  | 'EN_ADUANA'
  | 'LIBERADO'
  | 'EN_PATIO';

export interface LoteImportacion {
  id: number;
  codigo: string;
  numeroContenedor?: string;
  naviera?: string;
  puertoOrigen?: string;
  puertoDestino?: string;
  estado: EstadoLote;
  fechaEmbarque?: string;
  cantidadVehiculos: number;
  ms2EmbarqueId?: string | null;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export type TipoProveedorCompra = 'SUBASTA' | 'DEALER' | 'PRIVADO';

export interface CompraOrigen {
  id: number;
  vehiculoId: number;
  vehiculoVin: string;
  vehiculoTitulo: string;
  proveedor: string;
  tipoProveedor: TipoProveedorCompra;
  loteSubasta?: string;
  precioFob: number;
  fechaCompra: string;
  paisOrigen?: string;
  referenciaDocumento?: string;
  notas?: string;
  creadoEn: string;
}

export type TipoComprador = 'PERSONA_NATURAL' | 'EMPRESA';

export interface ChecklistItemEntrega {
  codigo: string;
  descripcion: string;
  completado: boolean;
  obligatorio: boolean;
  detalle: string;
}

export interface ChecklistEntrega {
  pedidoId: number;
  pedidoCodigo: string;
  vehiculoVin: string;
  listoParaEntregar: boolean;
  items: ChecklistItemEntrega[];
}

export interface EntregaRequest {
  recibidoPor: string;
  lugarEntrega?: string;
  tipoDocumentoRecibe?: string;
  numeroDocumentoRecibe?: string;
  kilometraje?: number;
  observaciones?: string;
  tipoComprador: TipoComprador;
  titularNombre?: string;
  rtn?: string;
  notario?: string;
  numeroTraspaso?: string;
}

export interface EntregaCompleta {
  pedido: Pedido;
  actaNumero: string;
  fechaEntrega: string;
  lugarEntrega?: string;
  recibidoPor: string;
  tipoComprador: TipoComprador;
  titularNombre: string;
  rtn?: string;
  numeroTraspaso?: string;
  estadoTraspaso: string;
  notario?: string;
}

export type { FlujoCompleto, PasoFlujo } from './ms-extensions';
