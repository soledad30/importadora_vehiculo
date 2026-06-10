import { apiFetch } from './client';

export type RolUsuario = 'ADMIN' | 'VENDEDOR' | 'CLIENTE';

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEn: number;
  username: string;
  rol: RolUsuario;
  clienteId: number | null;
  clienteNombre: string | null;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
