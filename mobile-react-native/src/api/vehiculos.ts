import { apiFetch } from './client';

export interface Vehiculo {
  id: number;
  vin: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  precio: number;
  estado: string;
  imagenUrl: string | null;
  paisOrigen: string;
  esImportado: boolean;
}

export async function listarVehiculos(): Promise<Vehiculo[]> {
  return apiFetch<Vehiculo[]>('/vehiculos');
}
