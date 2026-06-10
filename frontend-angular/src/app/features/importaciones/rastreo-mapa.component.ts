import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  ViewChild,
  effect
} from '@angular/core';
import { NbIconModule } from '@nebular/theme';
import { catchError, interval, of, Subscription } from 'rxjs';
import { EmbarqueSeguimiento, RastreoNaviero } from '../../core/models/ms-extensions';
import { Ms2Service } from '../../core/services/ms2.service';
import { simularRastreo } from '../../core/utils/rastreo-simulado';

type LeafletModule = typeof import('leaflet');

@Component({
  selector: 'app-rastreo-mapa',
  standalone: true,
  imports: [DecimalPipe, NbIconModule],
  templateUrl: './rastreo-mapa.component.html',
  styleUrl: './rastreo-mapa.component.scss'
})
export class RastreoMapaComponent implements AfterViewInit, OnDestroy {
  private readonly ms2 = inject(Ms2Service);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly embarques = input.required<EmbarqueSeguimiento[]>();
  readonly usarMs2 = input(false);
  readonly selectedEmbarqueId = input<string | null>(null);

  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;

  selectedId = '';
  rastreo: RastreoNaviero | null = null;
  mapError: string | null = null;
  mapReady = false;

  private L: LeafletModule | null = null;
  private map: import('leaflet').Map | null = null;
  private routeLayer: import('leaflet').Polyline | null = null;
  private markers: import('leaflet').LayerGroup | null = null;
  private refreshSub: Subscription | null = null;
  private pendingRastreo: RastreoNaviero | null = null;

  constructor() {
    effect(() => {
      const list = this.embarques();
      const externalId = this.selectedEmbarqueId();
      if (!list.length) return;

      if (externalId && list.some((e) => e.id === externalId)) {
        this.selectedId = externalId;
      } else if (!this.selectedId || !list.some((e) => e.id === this.selectedId)) {
        this.selectedId = list[0].id;
      }

      if (this.mapReady) {
        this.cargarRastreo();
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.embarques().length) return;

    const externalId = this.selectedEmbarqueId();
    this.selectedId = externalId && this.embarques().some((e) => e.id === externalId)
      ? externalId
      : this.embarques()[0].id;

    try {
      this.L = await import('leaflet');
      await this.initMap();
      this.mapReady = true;
      this.cargarRastreo();
      this.refreshSub = interval(30_000).subscribe(() => this.cargarRastreo());
    } catch {
      this.mapError = 'No se pudo cargar el mapa. Recargue la página (Ctrl+F5).';
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.map?.remove();
    this.map = null;
  }

  onEmbarqueChange(id: string): void {
    this.selectedId = id;
    this.cargarRastreo();
  }

  private async initMap(): Promise<void> {
    if (!this.L || this.map) return;

    this.map = this.L.map(this.mapHost.nativeElement, {
      center: [18, -88],
      zoom: 5,
      scrollWheelZoom: true
    });

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.markers = this.L.layerGroup().addTo(this.map);

    await new Promise((resolve) => setTimeout(resolve, 50));
    this.map.invalidateSize();

    if (this.pendingRastreo) {
      this.renderMap(this.pendingRastreo);
      this.pendingRastreo = null;
    }
  }

  private cargarRastreo(): void {
    const embarque = this.embarques().find((e) => e.id === this.selectedId);
    if (!embarque) return;

    const apply = (data: RastreoNaviero) => {
      this.rastreo = data;
      this.mapError = null;
      this.renderMap(data);
      this.cdr.markForCheck();
    };

    if (this.usarMs2()) {
      this.ms2
        .getRastreoEmbarque(embarque.id)
        .pipe(catchError(() => of(simularRastreo(embarque))))
        .subscribe(apply);
    } else {
      apply(simularRastreo(embarque));
    }
  }

  private renderMap(data: RastreoNaviero): void {
    if (!this.map || !this.markers || !this.L) {
      this.pendingRastreo = data;
      return;
    }

    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }
    this.markers.clearLayers();

    const rutaLatLng = data.ruta.map(([lat, lng]) => this.L!.latLng(lat, lng));
    this.routeLayer = this.L.polyline(rutaLatLng, { color: '#5b7cff', weight: 3, opacity: 0.85 }).addTo(this.map);

    this.L.marker([data.origen.lat, data.origen.lng], { icon: this.pinIcon('#00d68f') })
      .bindPopup(`<strong>Origen</strong><br>${data.origen.nombre}`)
      .addTo(this.markers);

    this.L.marker([data.destino.lat, data.destino.lng], { icon: this.pinIcon('#ffaa00') })
      .bindPopup(`<strong>Destino</strong><br>${data.destino.nombre}`)
      .addTo(this.markers);

    this.L.marker([data.posicionActual.lat, data.posicionActual.lng], { icon: this.pinIcon('#3366ff', true) })
      .bindPopup(
        `<strong>${data.vehiculo}</strong><br>${data.naviera}<br>Progreso: ${Math.round(data.progreso * 100)}%`
      )
      .addTo(this.markers);

    this.map.fitBounds(this.routeLayer.getBounds(), { padding: [32, 32] });
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private pinIcon(color: string, ship = false): import('leaflet').DivIcon {
    const symbol = ship ? '&#9973;' : '&#9679;';
    return this.L!.divIcon({
      className: 'rastreo-pin',
      html: `<span style="color:${color};font-size:${ship ? '22px' : '18px'}">${symbol}</span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }
}
