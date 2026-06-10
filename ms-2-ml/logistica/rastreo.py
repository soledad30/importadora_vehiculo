"""Simulación de rastreo naviero por embarque (ruta + posición según etapa)."""

from __future__ import annotations

from datetime import datetime, timezone

from .models import Embarque

# Coordenadas aproximadas de puertos usados en importaciones CA → Centroamérica
PUERTOS: dict[str, tuple[float, float]] = {
    "miami": (25.7781, -80.1794),
    "houston": (29.7355, -95.2676),
    "los angeles": (33.7405, -118.2770),
    "corinto": (12.4809, -87.1734),
    "puerto cortés": (15.8256, -87.9464),
    "puerto cortes": (15.8256, -87.9464),
    "san pedro sula": (15.5050, -88.0250),
}

PROGRESO_ETAPA: dict[str, float] = {
    "COMPRADO": 0.0,
    "EMBARCADO": 0.08,
    "EN_TRANSITO": 0.55,
    "EN_ADUANA": 0.92,
    "LIBERADO": 0.97,
    "EN_LOTE": 1.0,
}


def _resolver_puerto(nombre: str) -> tuple[float, float]:
    clave = (nombre or "").lower()
    for patron, coords in PUERTOS.items():
        if patron in clave:
            return coords
    return (20.0, -90.0)


def _interpolar(
    origen: tuple[float, float], destino: tuple[float, float], t: float
) -> tuple[float, float]:
    t = max(0.0, min(1.0, t))
    lat = origen[0] + (destino[0] - origen[0]) * t
    lng = origen[1] + (destino[1] - origen[1]) * t
    return (round(lat, 5), round(lng, 5))


def _generar_ruta(
    origen: tuple[float, float], destino: tuple[float, float], puntos: int = 24
) -> list[list[float]]:
    if puntos < 2:
        puntos = 2
    return [
        list(_interpolar(origen, destino, i / (puntos - 1)))
        for i in range(puntos)
    ]


def _progreso_dinamico(embarque: Embarque) -> float:
    base = PROGRESO_ETAPA.get(embarque.etapa_actual, 0.5)
    if embarque.etapa_actual != "EN_TRANSITO":
        return base
    # Pequeña variación en tránsito para simular movimiento en el mapa
    minuto = datetime.now(timezone.utc).minute
    offset = ((minuto + (embarque.pk or 0)) % 17) / 200.0 - 0.04
    return max(0.12, min(0.88, base + offset))


def calcular_rastreo(embarque: Embarque) -> dict:
    origen_coords = _resolver_puerto(embarque.origen)
    destino_coords = _resolver_puerto(embarque.destino)
    progreso = _progreso_dinamico(embarque)
    lat, lng = _interpolar(origen_coords, destino_coords, progreso)
    ruta = _generar_ruta(origen_coords, destino_coords)

    return {
        "embarqueId": str(embarque.pk),
        "codigo": embarque.codigo,
        "vehiculo": embarque.vehiculo,
        "naviera": embarque.naviera or "Por asignar",
        "etapaActual": embarque.etapa_actual,
        "simulado": True,
        "progreso": round(progreso, 3),
        "origen": {
            "nombre": embarque.origen or "Origen",
            "lat": origen_coords[0],
            "lng": origen_coords[1],
        },
        "destino": {
            "nombre": embarque.destino or "Destino",
            "lat": destino_coords[0],
            "lng": destino_coords[1],
        },
        "posicionActual": {
            "lat": lat,
            "lng": lng,
            "velocidadNudos": 16 if embarque.etapa_actual == "EN_TRANSITO" else 0,
            "actualizadoEn": datetime.now(timezone.utc).isoformat(),
        },
        "ruta": ruta,
    }
