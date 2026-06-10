"""Integración DL — YOLO local (best.pt) o inferencia en nube Roboflow (opción C).

Local:  ms-3-dl/models/damage_yolo.pt + USE_DL_MODEL=true
Nube:   ROBOFLOW_API_KEY + workspace/project/version + USE_DL_MODEL=true
"""

from __future__ import annotations

import io
import logging
import os
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image

logger = logging.getLogger(__name__)

USE_DL_MODEL = os.getenv("USE_DL_MODEL", "false").lower() in ("1", "true", "yes")
MODEL_PATH = os.getenv("DL_DAMAGE_MODEL_PATH", "").strip()
CONF_THRESHOLD = float(os.getenv("DL_CONF_THRESHOLD", "0.35"))
DEFAULT_MODEL = Path(__file__).resolve().parent.parent / "models" / "damage_yolo.pt"

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "").strip()
ROBOFLOW_WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "soles-workspace").strip()
ROBOFLOW_PROJECT = os.getenv("ROBOFLOW_PROJECT", "vehicle-damage-detection-nuiry").strip()
ROBOFLOW_VERSION = int(os.getenv("ROBOFLOW_VERSION", "1"))

_yolo_model = None
_roboflow_model = None
_class_names: dict[int, str] = {}

COSTO_POR_SEVERIDAD = {"Leve": 350, "Moderada": 800, "Severa": 1500}

CLASE_ES = {
    "scratch": "Rayadura",
    "scratches": "Rayadura",
    "dent": "Abolladura",
    "dents": "Abolladura",
    "crack": "Grieta",
    "cracks": "Grieta",
    "broken glass": "Vidrio roto",
    "broken_glass": "Vidrio roto",
    "shattered glass": "Vidrio roto",
    "glass shatter": "Vidrio roto",
    "flat tire": "Llanta dañada",
    "lamp broken": "Faro roto",
    "missing part": "Pieza faltante",
    "paint chip": "Despostillado",
    "rust": "Óxido",
    "tire flat": "Llanta dañada",
}


def roboflow_configured() -> bool:
    return bool(ROBOFLOW_API_KEY and ROBOFLOW_WORKSPACE and ROBOFLOW_PROJECT)


def resolve_model_path() -> Path | None:
    for candidate in (MODEL_PATH, str(DEFAULT_MODEL)):
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    return None


def dl_backend() -> str | None:
    if not USE_DL_MODEL:
        return None
    if resolve_model_path():
        return "yolo_local"
    if roboflow_configured():
        return "roboflow_cloud"
    return None


def dl_enabled() -> bool:
    return dl_backend() is not None


def model_status() -> dict[str, Any]:
    backend = dl_backend()
    return {
        "useDlModel": USE_DL_MODEL,
        "backend": backend,
        "modelPath": str(resolve_model_path()) if backend == "yolo_local" else None,
        "roboflow": {
            "configured": roboflow_configured(),
            "workspace": ROBOFLOW_WORKSPACE if roboflow_configured() else None,
            "project": ROBOFLOW_PROJECT if roboflow_configured() else None,
            "version": ROBOFLOW_VERSION if roboflow_configured() else None,
            "loaded": _roboflow_model is not None,
        },
        "yoloLoaded": _yolo_model is not None,
        "confThreshold": CONF_THRESHOLD,
        "classes": list(_class_names.values()) if _class_names else [],
    }


def _normalize_class(name: str) -> str:
    key = name.lower().strip().replace("-", "_").replace(" ", "_")
    key_spaced = key.replace("_", " ")
    return CLASE_ES.get(key, CLASE_ES.get(key_spaced, name.replace("_", " ").title()))


def _normalize_confidence(raw: float) -> float:
    """Roboflow puede devolver 0-1 o 0-100."""
    if raw > 1.0:
        return raw / 100.0
    return raw


def _severidad_y_costo(conf: float, area_ratio: float) -> tuple[str, int]:
    pct = conf * 100
    if pct >= 85 or area_ratio >= 0.08:
        return "Severa", COSTO_POR_SEVERIDAD["Severa"]
    if pct >= 60 or area_ratio >= 0.03:
        return "Moderada", COSTO_POR_SEVERIDAD["Moderada"]
    return "Leve", COSTO_POR_SEVERIDAD["Leve"]


def _build_detection(
    zona: str,
    tipo: str,
    conf: float,
    area_ratio: float,
    fuente: str,
) -> dict[str, Any]:
    severidad, costo = _severidad_y_costo(conf, area_ratio)
    return {
        "zona": zona,
        "tipo": tipo,
        "severidad": severidad,
        "confianza": round(conf * 100, 1),
        "reparacion": costo,
        "fuente": fuente,
    }


def _load_yolo():
    global _yolo_model, _class_names
    if _yolo_model is not None:
        return _yolo_model

    path = resolve_model_path()
    if not path:
        return None

    try:
        from ultralytics import YOLO

        _yolo_model = YOLO(str(path))
        raw = _yolo_model.names or {}
        _class_names = {int(k): _normalize_class(str(v)) for k, v in raw.items()}
        logger.info("YOLO local cargado: %s", path.name)
        return _yolo_model
    except Exception as exc:
        logger.error("Error cargando YOLO local: %s", exc)
        return None


def _load_roboflow():
    global _roboflow_model
    if _roboflow_model is not None:
        return _roboflow_model
    if not roboflow_configured():
        return None

    try:
        from roboflow import Roboflow

        rf = Roboflow(api_key=ROBOFLOW_API_KEY)
        project = rf.workspace(ROBOFLOW_WORKSPACE).project(ROBOFLOW_PROJECT)
        _roboflow_model = project.version(ROBOFLOW_VERSION).model
        logger.info(
            "Roboflow cloud: %s/%s v%s",
            ROBOFLOW_WORKSPACE,
            ROBOFLOW_PROJECT,
            ROBOFLOW_VERSION,
        )
        return _roboflow_model
    except Exception as exc:
        logger.error("Error conectando Roboflow: %s", exc)
        return None


def _detect_via_yolo(image_bytes: bytes, zona: str) -> list[dict[str, Any]]:
    model = _load_yolo()
    if model is None:
        return []

    try:
        results = model.predict(
            source=io.BytesIO(image_bytes),
            conf=CONF_THRESHOLD,
            verbose=False,
        )
    except Exception as exc:
        logger.error("Inferencia YOLO local falló: %s", exc)
        return []

    if not results or results[0].boxes is None or len(results[0].boxes) == 0:
        return []

    r0 = results[0]
    img_h, img_w = r0.orig_shape
    img_area = max(float(img_w * img_h), 1.0)
    detections: list[dict[str, Any]] = []

    for box in r0.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        area_ratio = max((x2 - x1) * (y2 - y1), 0.0) / img_area
        tipo = _class_names.get(cls_id, f"Daño #{cls_id}")
        detections.append(_build_detection(zona, tipo, conf, area_ratio, "yolo"))

    return sorted(detections, key=lambda d: d["confianza"], reverse=True)


def _detect_via_roboflow(image_bytes: bytes, zona: str) -> list[dict[str, Any]]:
    model = _load_roboflow()
    if model is None:
        return []

    img = Image.open(io.BytesIO(image_bytes))
    img_w, img_h = img.size
    img_area = max(float(img_w * img_h), 1.0)

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            img.convert("RGB").save(tmp, format="JPEG", quality=90)
            tmp_path = tmp.name

        conf_pct = max(1, min(99, int(CONF_THRESHOLD * 100)))
        prediction = model.predict(tmp_path, confidence=conf_pct, overlap=30)
        data = prediction.json()
    except Exception as exc:
        logger.error("Inferencia Roboflow falló: %s", exc)
        return []
    finally:
        if tmp_path and os.path.isfile(tmp_path):
            os.unlink(tmp_path)

    detections: list[dict[str, Any]] = []
    for item in data.get("predictions", []):
        conf = _normalize_confidence(float(item.get("confidence", 0)))
        if conf < CONF_THRESHOLD:
            continue
        w = float(item.get("width", 0))
        h = float(item.get("height", 0))
        area_ratio = max(w * h, 0.0) / img_area
        tipo = _normalize_class(str(item.get("class", "damage")))
        detections.append(_build_detection(zona, tipo, conf, area_ratio, "roboflow"))

    return sorted(detections, key=lambda d: d["confianza"], reverse=True)


def detect_damages_with_model(image_bytes: bytes, zona: str) -> list[dict[str, Any]]:
    """Detecta daños. Lista vacía con DL activo = sin daños detectados."""
    backend = dl_backend()
    if backend == "yolo_local":
        return _detect_via_yolo(image_bytes, zona)
    if backend == "roboflow_cloud":
        return _detect_via_roboflow(image_bytes, zona)
    return []


def detect_damage_with_model(image_bytes: bytes, zona: str) -> dict[str, Any] | None:
    hits = detect_damages_with_model(image_bytes, zona)
    return hits[0] if hits else None
