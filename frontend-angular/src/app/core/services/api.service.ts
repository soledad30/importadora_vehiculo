import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  ChecklistEntrega,
  CambioContrasenaRequest,
  Cliente,
  ClienteCreateRequest,
  CompraOrigen,
  EntregaCompleta,
  EntregaRequest,
  Factura,
  FlujoCompleto,
  ImpuestosAduana,
  Importacion,
  PagoAduanaRequest,
  LoteImportacion,
  MiPerfil,
  MiPerfilUpdateRequest,
  NotificacionItem,
  CategoriaNotificacion,
  Pedido,
  PedidoCreateRequest,
  ReporteResumen,
  ReporteFinanzas,
  ReporteImportaciones,
  Usuario,
  UsuarioCreate,
  Vehiculo,
  Vendedor,
  VendedorCreateRequest,
  VendedorResumen
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // Vehículos
  getVehiculos() {
    return this.http.get<Vehiculo[]>(`${this.base}/vehiculos`);
  }
  createVehiculo(body: Partial<Vehiculo>) {
    return this.http.post<Vehiculo>(`${this.base}/vehiculos`, body);
  }
  updateVehiculo(id: number, body: Partial<Vehiculo>) {
    return this.http.put<Vehiculo>(`${this.base}/vehiculos/${id}`, body);
  }
  deleteVehiculo(id: number) {
    return this.http.delete<void>(`${this.base}/vehiculos/${id}`);
  }
  uploadVehiculoImagen(archivo: File) {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.post<{ url: string; nombreArchivo: string }>(
      `${this.base}/vehiculos/imagen`,
      form
    );
  }

  // Clientes
  getClientes() {
    return this.http.get<Cliente[]>(`${this.base}/clientes`);
  }
  createCliente(body: ClienteCreateRequest) {
    return this.http.post<Cliente>(`${this.base}/clientes`, body);
  }
  updateCliente(id: number, body: ClienteCreateRequest) {
    return this.http.put<Cliente>(`${this.base}/clientes/${id}`, body);
  }
  toggleClienteActivo(id: number) {
    return this.http.post<Cliente>(`${this.base}/clientes/${id}/toggle-activo`, {});
  }
  asignarClienteAMi(id: number) {
    return this.http.post<Cliente>(`${this.base}/clientes/${id}/asignar-a-mi`, {});
  }

  // Usuarios
  getUsuarios() {
    return this.http.get<Usuario[]>(`${this.base}/usuarios`);
  }
  createUsuario(body: UsuarioCreate) {
    return this.http.post<Usuario>(`${this.base}/usuarios`, body);
  }
  desactivarUsuario(id: number) {
    return this.http.delete<void>(`${this.base}/usuarios/${id}`);
  }
  toggleUsuarioActivo(id: number) {
    return this.http.post<Usuario>(`${this.base}/usuarios/${id}/toggle-activo`, {});
  }
  restablecerContrasenaUsuario(id: number, password: string) {
    return this.http.put<void>(`${this.base}/usuarios/${id}/password`, { password });
  }

  // Pedidos
  getPedidos() {
    return this.http.get<Pedido[]>(`${this.base}/pedidos`);
  }
  getPedidosPorCliente(clienteId: number) {
    return this.http.get<Pedido[]>(`${this.base}/pedidos/cliente/${clienteId}`);
  }
  getPedido(id: number) {
    return this.http.get<Pedido>(`${this.base}/pedidos/${id}`);
  }
  createPedido(body: PedidoCreateRequest) {
    return this.http.post<Pedido>(`${this.base}/pedidos`, body);
  }
  confirmarPedido(id: number) {
    return this.http.post<Pedido>(`${this.base}/pedidos/${id}/confirmar`, {});
  }
  iniciarImportacionPedido(id: number, body?: Partial<Importacion> & { pedidoId?: number }) {
    const payload = body
      ? {
          paisOrigen: body.paisOrigen,
          aduana: body.aduana,
          puertoOrigen: body.puertoOrigen,
          puertoDestino: body.puertoDestino,
          naviera: body.naviera,
          numeroBl: body.numeroBl,
          numeroContenedor: body.numeroContenedor,
          numeroDespacho: body.numeroDespacho,
          fechaEstimadaEntrega: body.fechaEstimadaEntrega,
          ms2EmbarqueId: body.ms2EmbarqueId
        }
      : {};
    return this.http.post<Pedido>(`${this.base}/pedidos/${id}/importacion`, payload);
  }
  getChecklistEntrega(pedidoId: number) {
    return this.http.get<ChecklistEntrega>(`${this.base}/pedidos/${pedidoId}/checklist-entrega`);
  }
  entregarPedido(id: number, body: EntregaRequest) {
    return this.http.post<EntregaCompleta>(`${this.base}/pedidos/${id}/entregar`, body);
  }
  cancelarPedido(id: number) {
    return this.http.post<Pedido>(`${this.base}/pedidos/${id}/cancelar`, {});
  }
  tomarPedido(id: number) {
    return this.http.post<Pedido>(`${this.base}/pedidos/${id}/tomar`, {});
  }
  cerrarPedido(id: number, motivo: string) {
    return this.http.post<Pedido>(`${this.base}/pedidos/${id}/cerrar`, { motivo });
  }

  ejecutarFlujoCompleto(id: number, foto?: File) {
    const form = new FormData();
    if (foto) form.append('foto', foto);
    return this.http.post<FlujoCompleto>(
      `${this.base}/pedidos/${id}/flujo-completo`,
      form
    );
  }

  inspeccionarPedido(id: number, foto: File) {
    const form = new FormData();
    form.append('foto', foto);
    return this.http.post<unknown>(`${this.base}/pedidos/${id}/inspeccion`, form);
  }

  // Lotes de importación
  getLotes() {
    return this.http.get<LoteImportacion[]>(`${this.base}/lotes`);
  }
  createLote(body: Partial<LoteImportacion>) {
    return this.http.post<LoteImportacion>(`${this.base}/lotes`, body);
  }
  avanzarLote(id: number) {
    return this.http.post<LoteImportacion>(`${this.base}/lotes/${id}/avanzar`, {});
  }
  asignarVehiculoLote(loteId: number, vehiculoId: number) {
    return this.http.post<LoteImportacion>(`${this.base}/lotes/${loteId}/vehiculos/${vehiculoId}`, {});
  }

  // Compras en origen
  getComprasOrigen() {
    return this.http.get<CompraOrigen[]>(`${this.base}/compras-origen`);
  }
  getCompraOrigenPorVehiculo(vehiculoId: number) {
    return this.http.get<CompraOrigen>(`${this.base}/compras-origen/vehiculo/${vehiculoId}`);
  }
  createCompraOrigen(body: {
    vehiculoId: number;
    proveedor: string;
    tipoProveedor: string;
    loteSubasta?: string;
    precioFob: number;
    fechaCompra?: string;
    paisOrigen?: string;
    referenciaDocumento?: string;
    notas?: string;
  }) {
    return this.http.post<CompraOrigen>(`${this.base}/compras-origen`, body);
  }

  // Importaciones
  getImportaciones() {
    return this.http.get<Importacion[]>(`${this.base}/importaciones`);
  }
  createImportacion(body: Partial<Importacion> & { pedidoId: number }) {
    return this.http.post<Importacion>(`${this.base}/importaciones`, body);
  }
  getImpuestosAduana(importacionId: number) {
    return this.http.get<ImpuestosAduana>(`${this.base}/importaciones/${importacionId}/impuestos-aduana`);
  }
  registrarPagoAduana(importacionId: number, body: PagoAduanaRequest) {
    return this.http.post<Importacion>(`${this.base}/importaciones/${importacionId}/pago-aduana`, body);
  }

  // Facturas
  getFacturas() {
    return this.http.get<Factura[]>(`${this.base}/facturas`);
  }
  getFactura(id: number) {
    return this.http.get<Factura>(`${this.base}/facturas/${id}`);
  }
  getSiguienteNumeroFactura() {
    return this.http.get(`${this.base}/facturas/siguiente-numero`, { responseType: 'text' });
  }
  createFactura(body: {
    pedidoId: number;
    monto: number;
    subtotal?: number;
    isv?: number;
    cai?: string;
    rtnEmisor?: string;
    rtnCliente?: string;
    metodoPago?: string;
    numeroFactura?: string;
  }) {
    return this.http.post<Factura>(`${this.base}/facturas`, body);
  }
  emitirFactura(id: number) {
    return this.http.post<Factura>(`${this.base}/facturas/${id}/emitir`, {});
  }
  marcarFacturaPagada(id: number) {
    return this.http.post<Factura>(`${this.base}/facturas/${id}/pagar`, {});
  }

  // Vendedores
  getVendedores() {
    return this.http.get<Vendedor[]>(`${this.base}/vendedores`);
  }
  getVendedorResumen() {
    return this.http.get<VendedorResumen>(`${this.base}/vendedores/resumen`);
  }
  getVendedor(id: number) {
    return this.http.get<Vendedor>(`${this.base}/vendedores/${id}`);
  }
  createVendedor(body: VendedorCreateRequest) {
    return this.http.post<Vendedor>(`${this.base}/vendedores`, body);
  }
  toggleVendedorActivo(id: number) {
    return this.http.post<Vendedor>(`${this.base}/vendedores/${id}/toggle-activo`, {});
  }

  // Reportes
  getReporteResumen() {
    return this.http.get<ReporteResumen>(`${this.base}/reportes/resumen`);
  }
  getMiReporteResumen() {
    return this.http.get<ReporteResumen>(`${this.base}/reportes/mi-resumen`);
  }
  getReporteFinanzas() {
    return this.http.get<ReporteFinanzas>(`${this.base}/reportes/finanzas`);
  }
  getReporteImportaciones() {
    return this.http.get<ReporteImportaciones>(`${this.base}/reportes/importaciones`);
  }

  // Notificaciones
  getNotificaciones(categoria?: CategoriaNotificacion) {
    const params = categoria ? `?categoria=${categoria}` : '';
    return this.http.get<NotificacionItem[]>(`${this.base}/notificaciones${params}`);
  }
  getNotificacionesNoLeidas() {
    return this.http.get<{ total: number }>(`${this.base}/notificaciones/no-leidas`);
  }
  marcarNotificacionLeida(id: number) {
    return this.http.post<NotificacionItem>(`${this.base}/notificaciones/${id}/leida`, {});
  }
  marcarTodasNotificacionesLeidas() {
    return this.http.post<void>(`${this.base}/notificaciones/marcar-todas-leidas`, {});
  }

  // Mi cuenta
  getMiPerfil() {
    return this.http.get<MiPerfil>(`${this.base}/cuenta/me`);
  }
  updateMiPerfil(body: MiPerfilUpdateRequest) {
    return this.http.put<MiPerfil>(`${this.base}/cuenta/me`, body);
  }
  cambiarMiContrasena(body: CambioContrasenaRequest) {
    return this.http.put<void>(`${this.base}/cuenta/me/password`, body);
  }
}
