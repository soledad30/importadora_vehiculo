import { apiFetch } from './client';

export interface Pedido {
  id: number;
  codigo: string;
  clienteId: number;
  clienteNombre: string;
  vehiculoId: number;
  vehiculoDescripcion: string;
  vehiculoTitulo: string;
  vehiculoImagenUrl: string | null;
  vehiculoVin: string;
  estado: string;
  precioBase: number;
  impuestos: number;
  envio: number;
  total: number;
  notas: string | null;
}

export interface CrearPedidoRequest {
  clienteId: number;
  vehiculoId: number;
  notas?: string;
  impuestos?: number;
  envio?: number;
}

export async function listarPedidosCliente(clienteId: number): Promise<Pedido[]> {
  return apiFetch<Pedido[]>(`/pedidos/cliente/${clienteId}`);
}

export async function obtenerPedido(id: number): Promise<Pedido> {
  return apiFetch<Pedido>(`/pedidos/${id}`);
}

export async function crearPedido(data: CrearPedidoRequest): Promise<Pedido> {
  return apiFetch<Pedido>('/pedidos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function inspeccionarPedido(
  pedidoId: number,
  fotoUri: string,
  fileName = 'inspeccion.jpg',
): Promise<Record<string, unknown>> {
  const form = new FormData();
  form.append('foto', {
    uri: fotoUri,
    name: fileName,
    type: 'image/jpeg',
  } as unknown as Blob);

  return apiFetch<Record<string, unknown>>(`/pedidos/${pedidoId}/inspeccion`, {
    method: 'POST',
    body: form,
  });
}
