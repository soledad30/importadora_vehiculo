import { Component, ElementRef, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
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
import { navItemsForRole, NAV_LABEL_KEYS } from '../core/config/roles.config';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { I18nService } from '../core/services/i18n.service';
import { NotificacionesBadgeService } from '../core/services/notificaciones-badge.service';
import { UiPreferencesService } from '../core/services/ui-preferences.service';
import { TranslatePipe } from '../core/pipes/translate.pipe';

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
    NbUserModule,
    TranslatePipe
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly themeService = inject(NbThemeService);
  private readonly notifBadge = inject(NotificacionesBadgeService);
  private readonly uiPrefs = inject(UiPreferencesService);
  private readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly user = this.auth.currentUser;
  readonly currentTheme = signal<AppTheme>('dark');
  readonly noLeidas = this.notifBadge.noLeidas;
  readonly userMenuOpen = signal(false);
  readonly profileEmail = signal<string | null>(null);

  readonly themeIcon = computed(() =>
    this.currentTheme() === 'dark' ? 'sun-outline' : 'moon-outline'
  );

  readonly themeToggleLabel = computed(() => {
    this.i18n.lang();
    return this.currentTheme() === 'dark'
      ? this.i18n.t('shell.themeLight')
      : this.i18n.t('shell.themeDark');
  });

  readonly displayName = computed(() => {
    this.i18n.lang();
    const u = this.user();
    if (!u) return this.i18n.t('shell.defaultUser');
    return u.clienteNombre?.trim() || u.username;
  });

  readonly userInitials = computed(() => {
    const name = this.displayName();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly menuItems = computed((): NbMenuItem[] => {
    this.i18n.lang();
    const rol = this.auth.rol();
    const badgeCount = this.noLeidas();
    const items = navItemsForRole(rol);
    const result: NbMenuItem[] = [];

    for (const item of items) {
      const labelKey = NAV_LABEL_KEYS[item.path] ?? item.path;
      const menu: NbMenuItem = {
        title: this.i18n.t(labelKey),
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

      result.push(menu);
    }

    return result;
  });

  constructor() {
    this.i18n.applyStored();
    this.uiPrefs.applyStored();
    const saved = localStorage.getItem('importadora_theme');
    const theme: AppTheme = saved === 'default' || saved === 'dark' ? saved : 'dark';
    this.setTheme(theme);
    this.notifBadge.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.notifBadge.detenerPolling();
  }

  toggleUserMenu(): void {
    const next = !this.userMenuOpen();
    this.userMenuOpen.set(next);
    if (next && !this.profileEmail()) {
      this.api.getMiPerfil().subscribe({
        next: (p) => this.profileEmail.set(p.email),
        error: () => this.profileEmail.set(null)
      });
    }
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  navigateFromMenu(path: string, fragment?: string): void {
    this.closeUserMenu();
    void this.router.navigate([path], fragment ? { fragment } : undefined);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.closeUserMenu();
    }
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
    this.closeUserMenu();
    this.notifBadge.detenerPolling();
    this.notifBadge.limpiar();
    this.auth.logout();
  }
}
