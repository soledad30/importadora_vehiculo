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
  creadoEn: string;
  actualizadoEn: string;
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
