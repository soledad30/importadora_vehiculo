import { CategoriaNotificacion, NotificacionItem, RolUsuario } from '../models';

export interface DestinoNotificacion {
  path: string;
  queryParams?: Record<string, string | number>;
}

const RUTAS_POR_ROL: Partial<Record<RolUsuario, string[]>> = {
  ADMIN: [
    '/dashboard',
    '/vehiculos',
    '/clientes',
    '/pedidos',
    '/importaciones',
    '/documentos',
    '/facturas',
    '/notificaciones'
  ],
  VENDEDOR: ['/dashboard', '/vehiculos', '/clientes', '/pedidos', '/facturas', '/notificaciones'],
  CLIENTE: ['/dashboard', '/vehiculos', '/pedidos', '/notificaciones']
};

function tipoDestino(n: NotificacionItem): string | null {
  if (n.referenciaTipo) return n.referenciaTipo.toUpperCase();
  const map: Partial<Record<CategoriaNotificacion, string>> = {
    STOCK: 'VEHICULO',
    VEHICULO: 'VEHICULO',
    IMPORTACION: 'IMPORTACION',
    DOCUMENTO: 'DOCUMENTO',
    CLIENTE: 'CLIENTE',
    PEDIDO: 'PEDIDO',
    FACTURA: 'FACTURA',
    PREDICCION: 'PREDICCION',
    BLOCKCHAIN: 'BLOCKCHAIN',
    PROVEEDOR: 'PROVEEDOR'
  };
  return map[n.categoria] ?? null;
}

function rutaPorTipo(tipo: string): string | null {
  const map: Record<string, string> = {
    VEHICULO: '/vehiculos',
    PEDIDO: '/pedidos',
    CLIENTE: '/clientes',
    IMPORTACION: '/importaciones',
    DOCUMENTO: '/documentos',
    FACTURA: '/facturas',
    PREDICCION: '/dashboard',
    BLOCKCHAIN: '/blockchain',
    PROVEEDOR: '/proveedores'
  };
  return map[tipo] ?? null;
}

/** Resuelve ruta de navegación según referencia/categoría y rol del usuario. */
export function destinoNotificacion(
  n: NotificacionItem,
  rol: RolUsuario | null
): DestinoNotificacion | null {
  if (!rol) return null;

  const tipo = tipoDestino(n);
  if (!tipo) return null;

  const path = rutaPorTipo(tipo);
  if (!path) return null;

  const permitidas = RUTAS_POR_ROL[rol] ?? [];
  if (!permitidas.includes(path)) return null;

  const destino: DestinoNotificacion = { path };
  if (n.referenciaId != null && n.referenciaId > 0) {
    destino.queryParams = { ...(destino.queryParams ?? {}), focusId: n.referenciaId };
  }
  return destino;
}
