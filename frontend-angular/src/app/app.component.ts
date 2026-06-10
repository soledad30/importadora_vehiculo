import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { I18nService } from './core/services/i18n.service';

const THEME_CLASSES = ['nb-theme-default', 'nb-theme-dark'] as const;
const PUBLIC_PATHS = ['/login', '/registro'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  ngOnInit(): void {
    this.i18n.applyStored();
    const saved = localStorage.getItem('importadora_theme');
    const theme = saved === 'default' || saved === 'dark' ? saved : 'dark';
    this.applyThemeClass(theme);

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.guardPublicRoutes();
    });

    this.guardPublicRoutes();
  }

  private guardPublicRoutes(): void {
    if (this.auth.isLoggedIn()) return;
    const isPublic = PUBLIC_PATHS.some((p) => this.router.url.startsWith(p));
    if (!isPublic) {
      void this.router.navigate(['/login']);
    }
  }

  private applyThemeClass(theme: 'default' | 'dark'): void {
    document.body.classList.remove(...THEME_CLASSES);
    document.body.classList.add(`nb-theme-${theme}`);
  }
}
