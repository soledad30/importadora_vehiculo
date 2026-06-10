const LOGO_BASE =
  'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/thumb';

/** Marcas de vehículos soportadas en catálogo, importaciones y formularios. */
export const MARCAS_VEHICULO = [
  { id: 'volkswagen', nombre: 'Volkswagen', logoSlug: 'volkswagen' },
  { id: 'peugeot', nombre: 'Peugeot', logoSlug: 'peugeot' },
  { id: 'vauxhall', nombre: 'Vauxhall', logoSlug: 'vauxhall' },
  { id: 'renault', nombre: 'Renault', logoSlug: 'renault' },
  { id: 'ford', nombre: 'Ford', logoSlug: 'ford' },
  { id: 'toyota', nombre: 'Toyota', logoSlug: 'toyota' },
  { id: 'citroen', nombre: 'Citroen', logoSlug: 'citroen' },
  { id: 'volvo', nombre: 'Volvo', logoSlug: 'volvo' },
  { id: 'fiat', nombre: 'Fiat', logoSlug: 'fiat' },
  { id: 'mercedes', nombre: 'Mercedes', logoSlug: 'mercedes-benz' },
  { id: 'chevrolet', nombre: 'Chevrolet', logoSlug: 'chevrolet' },
  { id: 'honda', nombre: 'Honda', logoSlug: 'honda' },
  { id: 'audi', nombre: 'Audi', logoSlug: 'audi' },
  { id: 'skoda', nombre: 'Skoda', logoSlug: 'skoda' },
  { id: 'mazda', nombre: 'Mazda', logoSlug: 'mazda' },
  { id: 'kia', nombre: 'Kia', logoSlug: 'kia' },
  { id: 'bmw', nombre: 'BMW', logoSlug: 'bmw' },
  { id: 'suzuki', nombre: 'Suzuki', logoSlug: 'suzuki' },
  { id: 'nissan', nombre: 'Nissan', logoSlug: 'nissan' },
  { id: 'hyundai', nombre: 'Hyundai', logoSlug: 'hyundai' },
  { id: 'land-rover', nombre: 'Land Rover', logoSlug: 'land-rover' },
  { id: 'jaguar', nombre: 'Jaguar', logoSlug: 'jaguar' },
  { id: 'mitsubishi', nombre: 'Mitsubishi', logoSlug: 'mitsubishi' },
  { id: 'subaru', nombre: 'Subaru', logoSlug: 'subaru' },
  { id: 'porsche', nombre: 'Porsche', logoSlug: 'porsche' },
  { id: 'bentley', nombre: 'Bentley', logoSlug: 'bentley' },
  { id: 'lexus', nombre: 'Lexus', logoSlug: 'lexus' },
  { id: 'mini', nombre: 'Mini', logoSlug: 'mini' },
  { id: 'dacia', nombre: 'Dacia', logoSlug: 'dacia' },
  { id: 'tesla', nombre: 'Tesla', logoSlug: 'tesla' }
] as const;

export type MarcaVehiculoId = (typeof MARCAS_VEHICULO)[number]['id'];
export type MarcaVehiculo = (typeof MARCAS_VEHICULO)[number];

export function logoMarcaVehiculo(marca: string): string | null {
  const entry = buscarMarcaVehiculo(marca);
  return entry ? `${LOGO_BASE}/${entry.logoSlug}.png` : null;
}

export function buscarMarcaVehiculo(marca: string): MarcaVehiculo | undefined {
  const normalizada = marca.trim().toLowerCase();
  return MARCAS_VEHICULO.find(
    (m) =>
      m.nombre.toLowerCase() === normalizada ||
      m.id === normalizada ||
      m.logoSlug === normalizada
  );
}

export function nombresMarcasVehiculo(): string[] {
  return MARCAS_VEHICULO.map((m) => m.nombre);
}
