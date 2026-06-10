import { RolUsuario } from '../models';

export type NavSection = 'ms1' | 'integraciones' | 'cuenta';

export interface NavItemConfig {
  path: string;
  label: string;
  icon: string;
  roles: RolUsuario[];
  section: NavSection;
}

/** Menú lateral: MS-1 primero, integraciones MS-2/MS-3, Mi cuenta al final */
export const NAV_ITEMS: NavItemConfig[] = [
  // MS-1 · Principal
  { path: '/dashboard', label: 'Dashboard', icon: 'home-outline', roles: ['ADMIN', 'VENDEDOR', 'CLIENTE'], section: 'ms1' },
  { path: '/vehiculos', label: 'Vehículos', icon: 'car-outline', roles: ['ADMIN', 'VENDEDOR', 'CLIENTE'], section: 'ms1' },
  { path: '/clientes', label: 'Clientes', icon: 'people-outline', roles: ['ADMIN', 'VENDEDOR'], section: 'ms1' },
  { path: '/pedidos', label: 'Pedidos', icon: 'shopping-cart-outline', roles: ['ADMIN', 'VENDEDOR', 'CLIENTE'], section: 'ms1' },
  { path: '/facturas', label: 'Facturas', icon: 'file-text-outline', roles: ['ADMIN', 'VENDEDOR'], section: 'ms1' },
  { path: '/importaciones', label: 'Importaciones', icon: 'globe-outline', roles: ['ADMIN'], section: 'ms1' },
  { path: '/lotes', label: 'Lotes', icon: 'cube-outline', roles: ['ADMIN', 'VENDEDOR'], section: 'ms1' },
  { path: '/vendedores', label: 'Vendedores', icon: 'person-outline', roles: ['ADMIN'], section: 'ms1' },
  { path: '/usuarios', label: 'Usuarios', icon: 'person-add-outline', roles: ['ADMIN'], section: 'ms1' },
  { path: '/reportes', label: 'Reportes', icon: 'bar-chart-outline', roles: ['ADMIN'], section: 'ms1' },
  { path: '/notificaciones', label: 'Notificaciones', icon: 'bell-outline', roles: ['ADMIN', 'VENDEDOR', 'CLIENTE'], section: 'ms1' },

  // MS-2 / MS-3 · Integraciones
  { path: '/cotizador', label: 'Cotizador', icon: 'calculator-outline', roles: ['ADMIN', 'VENDEDOR'], section: 'integraciones' },
  { path: '/proveedores', label: 'Proveedores', icon: 'briefcase-outline', roles: ['ADMIN'], section: 'integraciones' },
  { path: '/documentos', label: 'Documentos', icon: 'folder-outline', roles: ['ADMIN'], section: 'integraciones' },
  { path: '/inspeccion-ia', label: 'Inspección IA', icon: 'eye-outline', roles: ['ADMIN'], section: 'integraciones' },
  { path: '/blockchain', label: 'Blockchain', icon: 'link-2-outline', roles: ['ADMIN'], section: 'integraciones' },

  // Al final
  { path: '/mi-cuenta', label: 'Mi cuenta', icon: 'person-outline', roles: ['ADMIN', 'VENDEDOR', 'CLIENTE'], section: 'cuenta' }
];

export function navItemsForRole(rol: RolUsuario | null) {
  if (!rol) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(rol));
}

export function routeRoles(path: string): RolUsuario[] | null {
  const item = NAV_ITEMS.find((n) => n.path === path);
  return item?.roles ?? null;
}

export { NAV_LABEL_KEYS, NAV_SECTION_KEYS } from '../i18n/translations';
