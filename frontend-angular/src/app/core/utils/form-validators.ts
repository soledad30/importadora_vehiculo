import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Acepta correos con caracteres acentuados (p. ej. ñ) que Validators.email rechaza. */
export const emailFormatValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string | null | undefined)?.trim();
  if (!value) {
    return null;
  }
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
  return ok ? null : { email: true };
};

export function parseDecimalInput(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const normalized = String(value).trim().replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
