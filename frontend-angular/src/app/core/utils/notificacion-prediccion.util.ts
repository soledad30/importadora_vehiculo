import { NotificacionItem, RolUsuario } from '../models';
import { DestinoNotificacion } from './notificacion-nav.util';

export interface RecomendacionImportacion {
  marca: string;
  modelo: string;
  cantidad: number;
  motivo: string;
}

/** Extrae marca, modelo y cantidad del mensaje de una notificación ML. */
export function parseRecomendacionImportacion(mensaje: string): RecomendacionImportacion {
  const importarMatch = mensaje.match(/importar\s+(\d+)\s+(.+?)(?:\s+[—–-]|$)/i);
  if (importarMatch) {
    const cantidad = Number(importarMatch[1]);
    const tokens = importarMatch[2].trim().split(/\s+/);
    const marca = tokens[0] ?? 'Toyota';
    const modelo = tokens.slice(1).join(' ') || 'General';
    return { marca, modelo, cantidad, motivo: mensaje };
  }

  const unidadesMatch = mensaje.match(/(\d+)\s+unidades/i);
  if (unidadesMatch) {
    const cantidad = Math.max(1, Math.min(Number(unidadesMatch[1]), 20));
    return { marca: 'Toyota', modelo: 'Hilux', cantidad, motivo: mensaje };
  }

  return { marca: 'Toyota', modelo: 'Hilux', cantidad: 5, motivo: mensaje };
}

export function destinoPlanificarImportacion(
  n: NotificacionItem,
  rol: RolUsuario | null
): DestinoNotificacion | null {
  if (!rol || n.categoria !== 'PREDICCION' || rol !== 'ADMIN') return null;

  const rec = parseRecomendacionImportacion(n.mensaje);
  return {
    path: '/importaciones',
    queryParams: {
      planificar: '1',
      marca: rec.marca,
      modelo: rec.modelo,
      cantidad: String(rec.cantidad)
    }
  };
}
