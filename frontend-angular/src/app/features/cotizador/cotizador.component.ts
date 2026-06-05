import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbInputModule, NbSpinnerModule } from '@nebular/theme';
import { CotizacionReciente, DesgloseCotizacion } from '../../core/models/ms-extensions';
import { Ms2MockService } from '../../core/services/ms2-mock.service';

@Component({
  selector: 'app-cotizador',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, NbCardModule, NbButtonModule, NbInputModule, NbSpinnerModule],
  templateUrl: './cotizador.component.html',
  styleUrl: './cotizador.component.scss'
})
export class CotizadorComponent implements OnInit {
  private readonly ms2 = inject(Ms2MockService);
  private readonly fb = inject(FormBuilder);

  readonly desglose = signal<DesgloseCotizacion | null>(null);
  readonly recientes = signal<CotizacionReciente[]>([]);
  readonly calculando = signal(false);

  readonly form = this.fb.nonNullable.group({
    precioCompra: [12500, [Validators.required, Validators.min(1)]],
    paisOrigen: ['Estados Unidos', Validators.required],
    puertoEmbarque: ['Houston, TX', Validators.required],
    puertoDestino: ['Puerto Cortés, HN', Validators.required],
    tipoVehiculo: ['SUV', Validators.required],
    anio: [2024, [Validators.required, Validators.min(1990)]],
    cilindrada: [2500, Validators.required],
    peso: [1750, Validators.required]
  });

  ngOnInit(): void {
    this.ms2.getCotizacionesRecientes().subscribe((data) => this.recientes.set(data));
    this.calcular();
  }

  calcular(): void {
    if (this.form.invalid) return;
    this.calculando.set(true);
    this.ms2.calcularCotizacion(this.form.getRawValue()).subscribe({
      next: (d) => { this.desglose.set(d); this.calculando.set(false); },
      error: () => this.calculando.set(false)
    });
  }
}
