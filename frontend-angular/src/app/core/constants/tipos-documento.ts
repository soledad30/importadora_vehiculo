/** Tipos de documento alineados con MS-3 (CATEGORIAS). */
export const TIPOS_DOCUMENTO = [
  { value: 'Titulo', label: 'Título de propiedad' },
  { value: 'Factura', label: 'Factura comercial' },
  { value: 'BL', label: 'Bill of Lading (BL)' },
  { value: 'Poliza', label: 'Póliza de importación' },
  { value: 'Permiso', label: 'Permiso fitosanitario' },
  { value: 'Carta', label: 'Carta de porte' }
] as const;

export type TipoDocumentoValue = (typeof TIPOS_DOCUMENTO)[number]['value'];

export function labelTipoDocumento(tipo: string): string {
  return TIPOS_DOCUMENTO.find((t) => t.value === tipo)?.label ?? tipo;
}
