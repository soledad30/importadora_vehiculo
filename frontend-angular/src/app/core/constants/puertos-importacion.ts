export interface PuertoImportacion {
  value: string;
  label: string;
  pais: string;
}

/** Puertos de salida habituales para importación de vehículos usados (EE.UU.) */
export const PUERTOS_EMBARQUE: PuertoImportacion[] = [
  { value: 'Houston, TX', label: 'Houston, TX — Texas', pais: 'Estados Unidos' },
  { value: 'Miami, FL', label: 'Miami, FL — Florida', pais: 'Estados Unidos' },
  { value: 'Jacksonville, FL', label: 'Jacksonville, FL — Florida', pais: 'Estados Unidos' },
  { value: 'Los Angeles, CA', label: 'Los Angeles, CA — California', pais: 'Estados Unidos' },
  { value: 'Baltimore, MD', label: 'Baltimore, MD — Maryland', pais: 'Estados Unidos' },
  { value: 'New York, NY', label: 'New York, NY — Nueva York', pais: 'Estados Unidos' }
];

/** Puertos de llegada en Centroamérica */
export const PUERTOS_DESTINO: PuertoImportacion[] = [
  { value: 'Puerto Cortés, HN', label: 'Puerto Cortés — Honduras', pais: 'Honduras' },
  { value: 'Corinto, NI', label: 'Corinto — Nicaragua', pais: 'Nicaragua' },
  { value: 'Santo Tomás de Castilla, GT', label: 'Santo Tomás de Castilla — Guatemala', pais: 'Guatemala' },
  { value: 'Acajutla, SV', label: 'Acajutla — El Salvador', pais: 'El Salvador' }
];
