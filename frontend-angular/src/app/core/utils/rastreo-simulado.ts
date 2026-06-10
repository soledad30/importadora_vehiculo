import { EmbarqueSeguimiento, EtapaEmbarque, RastreoNaviero } from '../models/ms-extensions';

const PUERTOS: Record<string, [number, number]> = {
  miami: [25.7781, -80.1794],
  houston: [29.7355, -95.2676],
  'los angeles': [33.7405, -118.277],
  corinto: [12.4809, -87.1734],
  'puerto cortés': [15.8256, -87.9464],
  'puerto cortes': [15.8256, -87.9464]
};

const PROGRESO_ETAPA: Record<EtapaEmbarque, number> = {
  COMPRADO: 0,
  EMBARCADO: 0.08,
  EN_TRANSITO: 0.55,
  EN_ADUANA: 0.92,
  LIBERADO: 0.97,
  EN_LOTE: 1
};

function resolverPuerto(nombre: string): [number, number] {
  const clave = (nombre || '').toLowerCase();
  for (const [patron, coords] of Object.entries(PUERTOS)) {
    if (clave.includes(patron)) return coords;
  }
  return [20, -90];
}

function interpolar(origen: [number, number], destino: [number, number], t: number): [number, number] {
  const p = Math.max(0, Math.min(1, t));
  return [
    +(origen[0] + (destino[0] - origen[0]) * p).toFixed(5),
    +(origen[1] + (destino[1] - origen[1]) * p).toFixed(5)
  ];
}

function generarRuta(origen: [number, number], destino: [number, number], puntos = 24): [number, number][] {
  return Array.from({ length: puntos }, (_, i) => interpolar(origen, destino, i / (puntos - 1)));
}

export function simularRastreo(embarque: EmbarqueSeguimiento): RastreoNaviero {
  const origenCoords = resolverPuerto(embarque.origen);
  const destinoCoords = resolverPuerto(embarque.destino);
  let progreso = PROGRESO_ETAPA[embarque.etapaActual] ?? 0.5;
  if (embarque.etapaActual === 'EN_TRANSITO') {
    const offset = (Date.now() / 60_000) % 17 / 200 - 0.04;
    progreso = Math.max(0.12, Math.min(0.88, progreso + offset));
  }
  const [lat, lng] = interpolar(origenCoords, destinoCoords, progreso);

  return {
    embarqueId: embarque.id,
    codigo: embarque.codigo,
    vehiculo: embarque.vehiculo,
    naviera: embarque.naviera,
    etapaActual: embarque.etapaActual,
    simulado: true,
    progreso: +progreso.toFixed(3),
    origen: { nombre: embarque.origen, lat: origenCoords[0], lng: origenCoords[1] },
    destino: { nombre: embarque.destino, lat: destinoCoords[0], lng: destinoCoords[1] },
    posicionActual: {
      nombre: embarque.vehiculo,
      lat,
      lng,
      velocidadNudos: embarque.etapaActual === 'EN_TRANSITO' ? 16 : 0,
      actualizadoEn: new Date().toISOString()
    },
    ruta: generarRuta(origenCoords, destinoCoords)
  };
}
