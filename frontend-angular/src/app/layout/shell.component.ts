import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  NbButtonModule,
  NbIconModule,
  NbLayoutModule,
  NbMenuItem,
  NbMenuModule,
  NbSidebarModule,
  NbThemeService,
  NbUserModule
} from '@nebular/theme';
import { navItemsForRole } from '../core/config/roles.config';
import { AuthService } from '../core/services/auth.service';
import { NotificacionesBadgeService } from '../core/services/notificaciones-badge.service';

type AppTheme = 'dark' | 'default';

const THEME_CLASSES = ['nb-theme-default', 'nb-theme-dark'] as const;

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    NbLayoutModule,
    NbSidebarModule,
    NbMenuModule,
    NbIconModule,
    NbButtonModule,
    NbUserModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly themeService = inject(NbThemeService);
  private readonly notifBadge = inject(NotificacionesBadgeService);

  readonly user = this.auth.currentUser;
  readonly currentTheme = signal<AppTheme>('dark');
  readonly noLeidas = this.notifBadge.noLeidas;

  readonly themeIcon = computed(() =>
    this.currentTheme() === 'dark' ? 'sun-outline' : 'moon-outline'
  );

  readonly themeToggleLabel = computed(() =>
    this.currentTheme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
  );

  readonly menuItems = computed((): NbMenuItem[] => {
    const rol = this.auth.rol();
    const badgeCount = this.noLeidas();
    return navItemsForRole(rol).map((item) => {
      const menu: NbMenuItem = {
        title: item.label,
        icon: item.icon,
        link: item.path,
        home: item.path === '/dashboard'
      };
      if (item.path === '/notificaciones' && badgeCount > 0) {
        menu.badge = {
          text: badgeCount > 99 ? '99+' : String(badgeCount),
          status: 'danger'
        };
      }
      return menu;
    });
  });

  constructor() {
    const saved = localStorage.getItem('importadora_theme');
    const theme: AppTheme = saved === 'default' || saved === 'dark' ? saved : 'dark';
    this.setTheme(theme);
    this.notifBadge.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.notifBadge.detenerPolling();
  }

  toggleTheme(): void {
    const next: AppTheme = this.currentTheme() === 'dark' ? 'default' : 'dark';
    this.setTheme(next);
  }

  private setTheme(name: AppTheme): void {
    this.currentTheme.set(name);
    localStorage.setItem('importadora_theme', name);
    this.themeService.changeTheme(name);
    document.body.classList.remove(...THEME_CLASSES);
    document.body.classList.add(`nb-theme-${name}`);
  }

  logout(): void {
    this.notifBadge.detenerPolling();
    this.notifBadge.limpiar();
    this.auth.logout();
  }
}
