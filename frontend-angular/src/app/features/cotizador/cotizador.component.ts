import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NbButtonModule, NbCardModule, NbInputModule, NbOptionModule, NbSelectModule, NbSpinnerModule } from '@nebular/theme';
import { CotizacionReciente, DesgloseCotizacion } from '../../core/models/ms-extensions';
import { PUERTOS_DESTINO, PUERTOS_EMBARQUE } from '../../core/constants/puertos-importacion';
import { Ms2Service } from '../../core/services/ms2.service';

@Component({
  selector: 'app-cotizador',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, NbCardModule, NbButtonModule, NbInputModule, NbSelectModule, NbOptionModule, NbSpinnerModule],
  templateUrl: './cotizador.component.html',
  styleUrl: './cotizador.component.scss'
})
export class CotizadorComponent implements OnInit {
  private readonly ms2 = inject(Ms2Service);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly desglose = signal<DesgloseCotizacion | null>(null);
  readonly recientes = signal<CotizacionReciente[]>([]);
  readonly calculando = signal(false);
  readonly puertosEmbarque = PUERTOS_EMBARQUE;
  readonly puertosDestino = PUERTOS_DESTINO;

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
    this.route.queryParamMap.subscribe((params) => {
      const tipo = params.get('tipoVehiculo');
      if (tipo) {
        this.form.patchValue({ tipoVehiculo: tipo }, { emitEvent: false });
      }
    });

    this.form.controls.puertoEmbarque.valueChanges.subscribe((value) => {
      const puerto = PUERTOS_EMBARQUE.find((p) => p.value === value);
      if (puerto) {
        this.form.patchValue({ paisOrigen: puerto.pais }, { emitEvent: false });
      }
    });

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
