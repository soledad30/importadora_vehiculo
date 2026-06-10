import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthConfig, LoginResponse, RolUsuario } from '../models';

const TOKEN_KEY = 'importadora_token';
const USER_KEY = 'importadora_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;

  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  private readonly userSignal = signal<LoginResponse | null>(this.getStoredUser());

  readonly currentUser = computed(() => this.userSignal());
  readonly rol = computed(() => this.userSignal()?.rol ?? null);
  readonly clienteId = computed(() => this.userSignal()?.clienteId ?? null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  isLoggedIn(): boolean {
    return !!this.tokenSignal();
  }

  getAuthConfig(): Observable<AuthConfig> {
    return this.http.get<AuthConfig>(`${this.api}/config`);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/login`, { username, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  loginWithGoogle(idToken: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/google`, { idToken })
      .pipe(tap((res) => this.persistSession(res)));
  }

  register(body: {
    nombreCompleto: string;
    email: string;
    telefono?: string;
    cedulaDocumento: string;
    rol: RolUsuario;
    password: string;
    confirmPassword: string;
  }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/register`, body)
      .pipe(tap((res) => this.persistSession(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    document.body.classList.remove('nb-theme-default', 'nb-theme-dark');
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  hasRole(...roles: RolUsuario[]): boolean {
    const r = this.rol();
    return r != null && roles.includes(r);
  }

  patchUser(partial: Partial<LoginResponse>): void {
    const current = this.userSignal();
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.userSignal.set(updated);
  }

  private persistSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res));
    this.tokenSignal.set(res.token);
    this.userSignal.set(res);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private getStoredUser(): LoginResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LoginResponse;
    } catch {
      return null;
    }
  }
}
