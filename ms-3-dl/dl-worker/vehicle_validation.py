"""Validación de calidad y coherencia entre las 4 vistas 360°."""

from __future__ import annotations

from typing import Any

import numpy as np
from PIL import Image, ImageFilter

import io

import numpy as np
from PIL import Image, ImageFilter


def load_image(data: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(data))
    return img.convert("RGB")

VISTA_LABELS = {
    "delante": "Delante",
    "detras": "Detrás",
    "izquierda": "Izquierda",
    "derecha": "Derecha",
}

MIN_CONSISTENCY = 0.72
MIN_BRIGHTNESS = 45.0
MAX_BRIGHTNESS = 228.0
MIN_CONTRAST = 28.0
MIN_SHARPNESS = 18.0


def _color_signature(data: bytes) -> tuple[np.ndarray, float, float, float]:
    img = load_image(data).resize((160, 120))
    arr = np.asarray(img, dtype=np.float32)
    sig_parts = []
    for channel in range(3):
        hist = np.histogram(arr[:, :, channel], bins=16, range=(0, 256))[0].astype(float)
        sig_parts.append(hist)
    sig = np.concatenate(sig_parts)
    sig = sig / (sig.sum() + 1e-6)

    gray = np.asarray(img.convert("L"), dtype=np.float32)
    brightness = float(gray.mean())
    contrast = float(gray.std())
    edges = np.asarray(img.convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    sharpness = float(edges.var())
    return sig, brightness, contrast, sharpness


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-6))


def validate_views_consistency(views: dict[str, bytes]) -> dict[str, Any]:
    """Punto 1, 2 y 4: mismo vehículo, buena luz y fondo limpio."""
    signatures: dict[str, np.ndarray] = {}
    qualities: dict[str, dict[str, float]] = {}
    problemas: list[str] = []

    for key, data in views.items():
        label = VISTA_LABELS.get(key, key)
        try:
            sig, brightness, contrast, sharpness = _color_signature(data)
        except Exception:
            problemas.append(f"Foto {label}: no se pudo leer la imagen.")
            continue
        signatures[key] = sig
        qualities[key] = {
            "brightness": brightness,
            "contrast": contrast,
            "sharpness": sharpness,
        }

        if brightness < MIN_BRIGHTNESS:
            problemas.append(f"Foto {label}: muy oscura — use luz natural o iluminación uniforme.")
        elif brightness > MAX_BRIGHTNESS:
            problemas.append(f"Foto {label}: sobreexpuesta — evite flash directo al carro.")
        if contrast < MIN_CONTRAST:
            problemas.append(f"Foto {label}: poco contraste — use fondo limpio y enfoque nítido.")
        if sharpness < MIN_SHARPNESS:
            problemas.append(f"Foto {label}: imagen borrosa — mantenga el teléfono estable al capturar.")

    keys = list(signatures.keys())
    similarities: list[float] = []
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            similarities.append(_cosine_similarity(signatures[keys[i]], signatures[keys[j]]))

    consistencia_min = min(similarities) if similarities else 1.0
    consistencia_pct = round(consistencia_min * 100, 1)

    if len(keys) == 4 and consistencia_min < MIN_CONSISTENCY:
        problemas.insert(
            0,
            "Las 4 fotos parecen ser de vehículos distintos (color o forma no coincide). "
            "Use el mismo auto en las cuatro vistas.",
        )

    return {
        "valido": len(problemas) == 0,
        "consistenciaMinima": consistencia_pct,
        "problemas": problemas,
        "calidadPorVista": {
            k: {
                "brillo": round(v["brightness"], 1),
                "contraste": round(v["contrast"], 1),
                "nitidez": round(v["sharpness"], 1),
            }
            for k, v in qualities.items()
        },
    }
