import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

/** Contador global de notificaciones no leídas + polling. */
@Injectable({ providedIn: 'root' })
export class NotificacionesBadgeService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private intervalId?: ReturnType<typeof setInterval>;
  private readonly pollMs = 30_000;

  readonly noLeidas = signal(0);

  iniciarPolling(): void {
    this.detenerPolling();
    this.actualizar();
    this.intervalId = setInterval(() => this.actualizar(), this.pollMs);
  }

  detenerPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  actualizar(): void {
    if (!this.auth.isLoggedIn()) {
      this.noLeidas.set(0);
      return;
    }
    this.api.getNotificacionesNoLeidas().subscribe({
      next: (r) => this.noLeidas.set(r.total),
      error: () => {}
    });
  }

  decrementar(): void {
    this.noLeidas.update((c) => Math.max(0, c - 1));
  }

  limpiar(): void {
    this.noLeidas.set(0);
  }
}
