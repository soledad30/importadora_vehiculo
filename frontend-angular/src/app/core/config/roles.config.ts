import { RolUsuario } from '../models';

export interface NavItemConfig {
  path: string;
  label: string;
  icon: string;
  roles: RolUsuario[];
}

/** Menú y rutas por rol */
export const NAV_ITEMS: NavItemConfig[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'home-outline', roles: ['ADMIN', 'VENDEDOR', 'CLIENTE'] },
  { path: '/vehiculos', label: 'Vehículos', icon: 'car-outline', roles: ['ADMIN', 'VENDEDOR', 'CLIENTE'] },
  { path: '/clientes', label: 'Clientes', icon: 'people-outline', roles: ['ADMIN', 'VENDEDOR'] },
  { path: '/pedidos', label: 'Pedidos', icon: 'shopping-cart-outline', roles: ['ADMIN', 'VENDEDOR', 'CLIENTE'] },
  { path: '/notificaciones', label: 'Notificaciones', icon: 'bell-outline', roles: ['ADMIN', 'VENDEDOR', 'CLIENTE'] },
  { path: '/cotizador', label: 'Cotizador', icon: 'calculator-outline', roles: ['ADMIN', 'VENDEDOR'] },
  { path: '/facturas', label: 'Facturas', icon: 'file-text-outline', roles: ['ADMIN', 'VENDEDOR'] },
  { path: '/importaciones', label: 'Importaciones', icon: 'globe-outline', roles: ['ADMIN'] },
  { path: '/documentos', label: 'Documentos', icon: 'folder-outline', roles: ['ADMIN'] },
  { path: '/proveedores', label: 'Proveedores', icon: 'briefcase-outline', roles: ['ADMIN'] },
  { path: '/blockchain', label: 'Blockchain', icon: 'link-2-outline', roles: ['ADMIN'] },
  { path: '/inspeccion-ia', label: 'Inspección IA', icon: 'eye-outline', roles: ['ADMIN'] },
  { path: '/reportes', label: 'Reportes', icon: 'bar-chart-outline', roles: ['ADMIN'] },
  { path: '/vendedores', label: 'Vendedores', icon: 'person-outline', roles: ['ADMIN'] },
  { path: '/usuarios', label: 'Usuarios', icon: 'person-add-outline', roles: ['ADMIN'] }
];

export function navItemsForRole(rol: RolUsuario | null) {
  if (!rol) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(rol));
}

export function routeRoles(path: string): RolUsuario[] | null {
  const item = NAV_ITEMS.find((n) => n.path === path);
  return item?.roles ?? null;
}
