import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbOptionModule,
  NbSelectModule,
  NbThemeService
} from '@nebular/theme';
import {
  AppLanguage,
  FONT_FAMILY_LABEL_KEYS,
  FONT_SIZE_LABEL_KEYS,
  LANGUAGE_OPTIONS
} from '../../core/i18n/translations';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import {
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  FontFamilyPreset,
  FontSizePreset,
  UiPreferencesService
} from '../../core/services/ui-preferences.service';

type AppTheme = 'dark' | 'default';
const THEME_CLASSES = ['nb-theme-default', 'nb-theme-dark'] as const;

@Component({
  selector: 'app-configuraciones',
  standalone: true,
  imports: [
    FormsModule,
    NbCardModule,
    NbButtonModule,
    NbSelectModule,
    NbOptionModule,
    NbIconModule,
    NbAlertModule,
    TranslatePipe
  ],
  templateUrl: './configuraciones.component.html',
  styleUrl: './configuraciones.component.scss'
})
export class ConfiguracionesComponent {
  private readonly uiPrefs = inject(UiPreferencesService);
  private readonly i18n = inject(I18nService);
  private readonly themeService = inject(NbThemeService);

  readonly languageOptions = LANGUAGE_OPTIONS;
  readonly saved = signal(false);

  fontFamily = this.uiPrefs.preferences().fontFamily;
  fontSize = this.uiPrefs.preferences().fontSize;
  language: AppLanguage = this.i18n.lang();
  theme: AppTheme =
    (localStorage.getItem('importadora_theme') as AppTheme) === 'default' ? 'default' : 'dark';

  readonly fontFamilyOptions = computed(() => {
    this.i18n.lang();
    return FONT_FAMILY_OPTIONS.map((opt) => ({
      value: opt.value,
      label: this.i18n.t(FONT_FAMILY_LABEL_KEYS[opt.value])
    }));
  });

  readonly fontSizeOptions = computed(() => {
    this.i18n.lang();
    return FONT_SIZE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: this.i18n.t(FONT_SIZE_LABEL_KEYS[opt.value])
    }));
  });

  previewFontFamily(): string {
    return this.uiPrefs.cssFontFamily(this.fontFamily as FontFamilyPreset);
  }

  previewFontSize(): string {
    return this.uiPrefs.cssFontSize(this.fontSize as FontSizePreset);
  }

  onTypographyChange(): void {
    this.uiPrefs.applyPreview({
      fontFamily: this.fontFamily as FontFamilyPreset,
      fontSize: this.fontSize as FontSizePreset
    });
  }

  save(): void {
    this.uiPrefs.update({
      fontFamily: this.fontFamily as FontFamilyPreset,
      fontSize: this.fontSize as FontSizePreset
    });
    this.i18n.setLanguage(this.language);
    this.applyTheme(this.theme);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  reset(): void {
    const prefs = this.uiPrefs.reset();
    this.fontFamily = prefs.fontFamily;
    this.fontSize = prefs.fontSize;
    this.language = 'es';
    this.i18n.resetLanguage();
    this.theme = 'dark';
    this.applyTheme('dark');
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  private applyTheme(name: AppTheme): void {
    localStorage.setItem('importadora_theme', name);
    this.themeService.changeTheme(name);
    document.body.classList.remove(...THEME_CLASSES);
    document.body.classList.add(`nb-theme-${name}`);
  }
}
