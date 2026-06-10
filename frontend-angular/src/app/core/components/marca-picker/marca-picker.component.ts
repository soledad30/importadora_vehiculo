import { Component, forwardRef, Input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MARCAS_VEHICULO, logoMarcaVehiculo } from '../../constants/marcas-vehiculo';

@Component({
  selector: 'app-marca-picker',
  standalone: true,
  templateUrl: './marca-picker.component.html',
  styleUrl: './marca-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarcaPickerComponent),
      multi: true
    }
  ]
})
export class MarcaPickerComponent implements ControlValueAccessor {
  readonly marcas = MARCAS_VEHICULO;
  readonly logoMarca = logoMarcaVehiculo;

  @Input() compact = false;

  readonly selected = signal<string>('');
  readonly disabled = signal(false);
  readonly failedLogos = signal<Set<string>>(new Set());

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.selected.set(value?.trim() ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  selectMarca(nombre: string): void {
    if (this.disabled()) return;
    this.selected.set(nombre);
    this.onChange(nombre);
    this.onTouched();
  }

  onLogoError(slug: string): void {
    this.failedLogos.update((set) => new Set(set).add(slug));
  }

  logoFailed(slug: string): boolean {
    return this.failedLogos().has(slug);
  }
}
