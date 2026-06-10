import { Injectable, signal } from '@angular/core';

export type FontSizePreset = 'sm' | 'md' | 'lg' | 'xl';
export type FontFamilyPreset =
  | 'system'
  | 'segoe'
  | 'arial'
  | 'times'
  | 'roboto'
  | 'open-sans'
  | 'poppins'
  | 'montserrat'
  | 'merriweather'
  | 'comfortaa'
  | 'courier';

export interface UiPreferences {
  fontFamily: FontFamilyPreset;
  fontSize: FontSizePreset;
}

const STORAGE_KEY = 'importadora_ui_prefs';

export const FONT_SIZE_VALUES: Record<FontSizePreset, string> = {
  sm: '14px',
  md: '16px',
  lg: '20px',
  xl: '24px'
};

export const FONT_FAMILY_VALUES: Record<FontFamilyPreset, string> = {
  system:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  segoe: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  arial: 'Arial, Helvetica, sans-serif',
  times: '"Times New Roman", Times, Georgia, serif',
  roboto: 'Roboto, "Helvetica Neue", Arial, sans-serif',
  'open-sans': '"Open Sans", "Segoe UI", Roboto, Arial, sans-serif',
  poppins: 'Poppins, "Segoe UI", sans-serif',
  montserrat: 'Montserrat, "Segoe UI", sans-serif',
  merriweather: 'Merriweather, Georgia, "Times New Roman", serif',
  comfortaa: 'Comfortaa, "Segoe UI", sans-serif',
  courier: '"Courier Prime", "Courier New", Courier, monospace'
};

export const FONT_SIZE_OPTIONS: { value: FontSizePreset; label: string }[] = [
  { value: 'sm', label: 'Pequeña (14 px)' },
  { value: 'md', label: 'Normal (16 px)' },
  { value: 'lg', label: 'Grande (20 px)' },
  { value: 'xl', label: 'Muy grande (24 px)' }
];

export const FONT_FAMILY_OPTIONS: { value: FontFamilyPreset; label: string }[] = [
  { value: 'system', label: 'Sistema (recomendada)' },
  { value: 'segoe', label: 'Segoe UI — estándar Windows' },
  { value: 'arial', label: 'Arial — sans clásica' },
  { value: 'times', label: 'Times — serif clásica' },
  { value: 'roboto', label: 'Roboto — Google/Android' },
  { value: 'open-sans', label: 'Open Sans — legible' },
  { value: 'poppins', label: 'Poppins — redondeada moderna' },
  { value: 'montserrat', label: 'Montserrat — geométrica' },
  { value: 'merriweather', label: 'Merriweather — serif elegante' },
  { value: 'comfortaa', label: 'Comfortaa — display suave' },
  { value: 'courier', label: 'Courier — monoespaciada' }
];

const DEFAULT_PREFS: UiPreferences = {
  fontFamily: 'system',
  fontSize: 'md'
};

const VALID_FONTS = new Set<string>(Object.keys(FONT_FAMILY_VALUES));
const VALID_SIZES = new Set<string>(Object.keys(FONT_SIZE_VALUES));

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  readonly preferences = signal<UiPreferences>(this.load());

  applyStored(): void {
    this.apply(this.preferences());
  }

  applyPreview(partial: Partial<UiPreferences>): void {
    const next = { ...this.preferences(), ...partial };
    this.apply(next);
  }

  update(partial: Partial<UiPreferences>): UiPreferences {
    const next = { ...this.preferences(), ...partial };
    this.preferences.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.apply(next);
    return next;
  }

  reset(): UiPreferences {
    localStorage.removeItem(STORAGE_KEY);
    this.preferences.set({ ...DEFAULT_PREFS });
    this.apply(DEFAULT_PREFS);
    return DEFAULT_PREFS;
  }

  cssFontFamily(family: FontFamilyPreset): string {
    return FONT_FAMILY_VALUES[family];
  }

  cssFontSize(size: FontSizePreset): string {
    return FONT_SIZE_VALUES[size];
  }

  private load(): UiPreferences {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    try {
      const parsed = JSON.parse(raw) as Partial<UiPreferences>;
      return {
        fontFamily: VALID_FONTS.has(parsed.fontFamily ?? '')
          ? (parsed.fontFamily as FontFamilyPreset)
          : DEFAULT_PREFS.fontFamily,
        fontSize: VALID_SIZES.has(parsed.fontSize ?? '')
          ? (parsed.fontSize as FontSizePreset)
          : DEFAULT_PREFS.fontSize
      };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  }

  private apply(prefs: UiPreferences): void {
    const root = document.documentElement;
    root.style.setProperty('--app-font-size-base', FONT_SIZE_VALUES[prefs.fontSize]);
    root.style.setProperty('--app-font-family', FONT_FAMILY_VALUES[prefs.fontFamily]);
    root.dataset['fontSize'] = prefs.fontSize;
    root.dataset['fontFamily'] = prefs.fontFamily;
  }
}
