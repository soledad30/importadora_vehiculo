import { Injectable, signal } from '@angular/core';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';

const STORAGE_KEY = 'importadora_lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<AppLanguage>(this.load());

  t(key: string, fallback?: string): string {
    const lang = this.lang();
    return TRANSLATIONS[lang][key] ?? TRANSLATIONS.es[key] ?? fallback ?? key;
  }

  setLanguage(language: AppLanguage): void {
    this.lang.set(language);
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }

  applyStored(): void {
    document.documentElement.lang = this.lang();
  }

  resetLanguage(): void {
    this.setLanguage('es');
  }

  private load(): AppLanguage {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'en' ? 'en' : 'es';
  }
}
