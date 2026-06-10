"""Análisis heurístico de imágenes — base para modelos DL futuros (ver dl_models.py)."""

import io
import re
from typing import Any

import numpy as np
from PIL import Image, ImageFilter, ImageStat

from dl_models import detect_damages_with_model, dl_backend, dl_enabled
from vehicle_validation import validate_views_consistency

ZONAS = [
    ("Parachoques Frontal", (0.0, 0.0, 0.5, 0.35)),
    ("Puerta izquierda", (0.0, 0.35, 0.45, 0.75)),
    ("Puerta derecha", (0.55, 0.35, 1.0, 0.75)),
    ("Parachoques Trasero", (0.0, 0.75, 1.0, 1.0)),
]

VISTAS_360 = {
    "delante": "Parachoques Frontal",
    "detras": "Parachoques Trasero",
    "izquierda": "Puerta izquierda",
    "derecha": "Puerta derecha",
}

UMBRAL_VISTA_360 = 320

SEVERIDAD_POR_VAR = [
    (120, "Leve", 350),
    (220, "Moderada", 800),
    (400, "Severa", 1500),
]


def _load_image(data: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(data))
    return img.convert("RGB")


def _region_variance(gray: Image.Image, box: tuple[float, float, float, float]) -> float:
    w, h = gray.size
    left = int(box[0] * w)
    top = int(box[1] * h)
    right = max(left + 1, int(box[2] * w))
    bottom = max(top + 1, int(box[3] * h))
    crop = gray.crop((left, top, right, bottom))
    edges = crop.filter(ImageFilter.FIND_EDGES)
    arr = np.asarray(edges, dtype=np.float32)
    return float(arr.var())


def _aggregate_danos(danos: list[dict[str, Any]], modo: str = "simple", extra: dict | None = None) -> dict[str, Any]:
    costo_total = sum(d["reparacion"] for d in danos)
    severidad_global = "Sin daños"
    if danos:
        orden = {"Leve": 1, "Moderada": 2, "Severa": 3}
        severidad_global = max(danos, key=lambda d: orden.get(d["severidad"], 0))["severidad"]
    payload: dict[str, Any] = {
        "danosDetectados": len(danos),
        "severidad": severidad_global,
        "costoReparacion": costo_total,
        "danos": danos,
        "motorAnalisis": (
            danos[0].get("fuente", "heuristica")
            if dl_enabled() and danos
            else ("roboflow" if dl_backend() == "roboflow_cloud" else "yolo" if dl_enabled() else "heuristica")
        ),
    }
    if modo:
        payload["modo"] = modo
    if extra:
        payload.update(extra)
    return payload


def _danos_desde_vista(data: bytes, zona: str) -> list[dict[str, Any]]:
    if dl_enabled():
        return detect_damages_with_model(data, zona)

    img = _load_image(data)
    gray = img.convert("L")
    var = _region_variance(gray, (0.0, 0.0, 1.0, 1.0))
    if var < UMBRAL_VISTA_360:
        return []
    return [_damage_from_variance(var, zona)]


def analyze_damage(data: bytes) -> dict[str, Any]:
    if dl_enabled():
        hits = detect_damages_with_model(data, "Vista general")
        return _aggregate_danos(hits)

    img = _load_image(data)
    gray = img.convert("L")
    danos: list[dict[str, Any]] = []

    for zona, box in ZONAS:
        var = _region_variance(gray, box)
        if var < 90:
            continue
        severidad, costo = "Leve", 350
        for umbral, sev, rep in SEVERIDAD_POR_VAR:
            if var >= umbral:
                severidad, costo = sev, rep
        tipo = "Abolladura" if var > 200 else "Rayadura"
        confianza = min(99.0, 70.0 + var / 8.0)
        danos.append({
            "zona": zona,
            "tipo": tipo,
            "severidad": severidad,
            "confianza": round(confianza, 1),
            "reparacion": costo,
        })

    danos = sorted(danos, key=lambda d: d["confianza"], reverse=True)[:4]
    return _aggregate_danos(danos)


def _damage_from_variance(var: float, zona: str) -> dict[str, Any]:
    severidad, costo = "Leve", 350
    for umbral, sev, rep in SEVERIDAD_POR_VAR:
        if var >= umbral:
            severidad, costo = sev, rep
    tipo = "Abolladura" if var > 200 else "Rayadura"
    confianza = min(99.0, 70.0 + var / 8.0)
    return {
        "zona": zona,
        "tipo": tipo,
        "severidad": severidad,
        "confianza": round(confianza, 1),
        "reparacion": costo,
    }


def analyze_damage_view(data: bytes, zona: str) -> dict[str, Any] | None:
    """Analiza una foto dedicada de una vista (360°)."""
    hits = _danos_desde_vista(data, zona)
    return hits[0] if hits else None


def analyze_damage_views_all(data: bytes, zona: str) -> list[dict[str, Any]]:
    return _danos_desde_vista(data, zona)


def analyze_damage_360(views: dict[str, bytes]) -> dict[str, Any]:
    """Inspección con 4 fotos: delante, detrás, izquierda, derecha."""
    validacion = validate_views_consistency(views)
    if not validacion["valido"]:
        return {
            "error": True,
            "codigo": "VALIDACION_VISTAS",
            "mensaje": validacion["problemas"][0],
            "problemas": validacion["problemas"],
            "consistenciaMinima": validacion["consistenciaMinima"],
        }

    danos: list[dict[str, Any]] = []
    for key, content in views.items():
        zona = VISTAS_360.get(key)
        if not zona:
            continue
        danos.extend(analyze_damage_views_all(content, zona))

    danos = sorted(danos, key=lambda d: d["confianza"], reverse=True)
    return _aggregate_danos(
        danos,
        modo="360",
        extra={
            "validacionCalidad": {
                "consistenciaMinima": validacion["consistenciaMinima"],
                "calidadPorVista": validacion["calidadPorVista"],
            }
        },
    )


def analyze_model(data: bytes, vin_hint: str | None = None) -> dict[str, Any]:
    img = _load_image(data)
    stat = ImageStat.Stat(img)
    avg = sum(stat.mean) / 3
    spread = sum(stat.stddev) / 3
    confianza = min(99.5, 75.0 + spread / 4.0)

    modelo = "Vehículo importado detectado"
    if vin_hint and len(vin_hint) >= 11:
        wmi = vin_hint[:3].upper()
        marcas = {"2T3": "Toyota", "1HG": "Honda", "1N4": "Nissan", "1FA": "Ford", "JM1": "Mazda"}
        marca = marcas.get(wmi, "Vehículo")
        modelo = f"{marca} — análisis visual {int(img.size[0])}x{int(img.size[1])}"

    return {
        "modeloDetectado": modelo,
        "confianzaModelo": round(confianza, 1),
        "brilloPromedio": round(avg, 1),
    }


def _strip_html(text: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</p>", "\n", text, flags=re.I)
    return re.sub(r"<[^>]+>", " ", text)


def _pdf_text(data: bytes) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        parts = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        return "\n".join(parts).strip()
    except Exception:
        return ""


def _document_text(data: bytes, filename: str | None = None) -> str:
    lower = (filename or "").lower()
    if lower.endswith(".pdf") or data[:4] == b"%PDF":
        text = _pdf_text(data)
        if text:
            return text
    try:
        raw = data.decode("utf-8", errors="ignore")
    except Exception:
        return ""
    if "<html" in raw.lower() or "<body" in raw.lower():
        return _strip_html(raw)
    return raw.strip()


def _extract_html_ocr(data: bytes) -> dict[str, str] | None:
    try:
        raw = data.decode("utf-8", errors="ignore")
    except Exception:
        return None
    if "<html" not in raw.lower() and "<body" not in raw.lower():
        return None
    out: dict[str, str] = {}

    label_patterns = (
        (r"Propietario", "propietario"),
        (r"Aseguradora", "propietario"),
        (r"Beneficiario", "propietario"),
        (r"Exportador", "propietario"),
        (r"Importador", "estado"),
        (r"(?:Estado emisor|Estado)", "estado"),
        (r"Fecha emisi[oó]n", "fechaEmision"),
        (r"Fecha", "fechaEmision"),
        (r"(?:Tipo t[ií]tulo|Tipo documento|Tipo de Seguro)", "tipoTitulo"),
        (r"Vigencia", "vigencia"),
    )
    for label, key in label_patterns:
        m = re.search(
            rf"<strong>\s*{label}\s*:?\s*</strong>\s*([^<\n|]+)",
            raw,
            re.I,
        )
        if m and m.group(1).strip() and key not in out:
            out[key] = m.group(1).strip().rstrip("|").strip()

        m2 = re.search(
            rf"{label}\s*</div>\s*<strong>([^<]+)</strong>",
            raw,
            re.I,
        )
        if m2 and m2.group(1).strip() and key not in out:
            out[key] = m2.group(1).strip()

    vin_m = re.search(
        r"<strong>\s*VIN\s*:?\s*</strong>\s*([A-HJ-NPR-Z0-9]{17})",
        raw,
        re.I,
    )
    if vin_m:
        out["vin"] = vin_m.group(1).upper()
    if "vin" not in out:
        vin_m2 = re.search(r"VIN\s*</div>\s*<strong>([A-HJ-NPR-Z0-9]{17})</strong>", raw, re.I)
        if vin_m2:
            out["vin"] = vin_m2.group(1).upper()

    if not out.get("propietario"):
        m = re.search(r"propiedad de\s*<strong>([^<]+)</strong>", raw, re.I)
        if m:
            out["propietario"] = m.group(1).strip()

    ref_m = re.search(r"\b(POL|FAC|BL|TIT|PER|CAR)-\d{4}-\d+\b", raw, re.I)
    if ref_m:
        out["referencia"] = ref_m.group(0).upper()

    return out if out else None


def _extract_fields_from_text(text: str) -> dict[str, str]:
    """Extrae campos de texto plano (PDF o HTML renderizado)."""
    if not text or len(text.strip()) < 8:
        return {}

    out: dict[str, str] = {}
    normalized = re.sub(r"\s+", " ", text)

    vin_m = re.search(r"\bVIN\s*[:\-]?\s*([A-HJ-NPR-Z0-9]{17})\b", text, re.I)
    if vin_m:
        out["vin"] = vin_m.group(1).upper()
    else:
        any_vin = re.search(r"\b([A-HJ-NPR-Z0-9]{17})\b", text)
        if any_vin:
            out["vin"] = any_vin.group(1).upper()

    ref_m = re.search(
        r"\b(?:N[uú]mero de P[oó]liza|No\.?\s*(?:de\s*)?P[oó]liza|P[oó]liza\s*(?:N[o°\.]|#)?)\s*[:\-]?\s*"
        r"(POL-\d{4}-\d+)\b",
        text,
        re.I,
    )
    if ref_m:
        out["referencia"] = ref_m.group(1).upper()
    else:
        code_m = re.search(r"\b(POL|FAC|BL|TIT|PER|CAR)-\d{4}-\d+\b", text, re.I)
        if code_m:
            out["referencia"] = code_m.group(0).upper()

    label_value = (
        (r"Aseguradora", "propietario"),
        (r"Beneficiario", "propietario"),
        (r"Exportador", "propietario"),
        (r"Propietario", "propietario"),
        (r"Importador", "estado"),
        (r"Emisor", "propietario"),
        (r"Fecha de Emisi[oó]n", "fechaEmision"),
        (r"Fecha", "fechaEmision"),
        (r"Estado", "estado"),
        (r"Vigencia", "estado"),
        (r"Tipo de Seguro", "tipoTitulo"),
    )
    for label, key in label_value:
        if out.get(key):
            continue
        m = re.search(rf"{label}\s*[:\|]\s*([^\n|]+)", text, re.I)
        if m and m.group(1).strip():
            val = m.group(1).strip()
            if len(val) > 2:
                out[key] = val

    if not out.get("propietario"):
        seg_m = re.search(r"(SEGUROS[\w\s\.&-]{3,60}?S\.?\s*A\.?)", text, re.I)
        if seg_m:
            out["propietario"] = seg_m.group(1).strip()

    if not out.get("fechaEmision"):
        iso_m = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", text)
        if iso_m:
            out["fechaEmision"] = iso_m.group(1)
        else:
            esp_m = re.search(
                r"(\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|"
                r"septiembre|octubre|noviembre|diciembre)\s+de\s+20\d{2})",
                text,
                re.I,
            )
            if esp_m:
                out["fechaEmision"] = esp_m.group(1)

    if "VERIFICADO" in normalized.upper() or "VIGENTE" in normalized.upper():
        out["estado"] = out.get("estado") or "VIGENTE / VERIFICADO"

    return out


def analyze_ocr(
    data: bytes,
    filename: str | None = None,
    vin_hint: str | None = None,
) -> dict[str, Any]:
    contrast = 0.0
    confianza = 55.0
    try:
        img = _load_image(data)
        gray = img.convert("L")
        contrast = ImageStat.Stat(gray).stddev[0]
        confianza = min(98.0, 60.0 + contrast / 3.0)
    except Exception:
        confianza = 72.0 if filename and filename.lower().endswith((".pdf", ".html", ".htm")) else 55.0

    html_fields = _extract_html_ocr(data) or {}
    plain_text = _document_text(data, filename)
    text_fields = _extract_fields_from_text(plain_text)
    merged = {**text_fields, **html_fields}

    vin = None
    if vin_hint and len(vin_hint.strip()) >= 11:
        vin = vin_hint.strip().upper()
    if not vin:
        vin = merged.get("vin")
    if not vin:
        vin = merged.get("referencia")
    if not vin:
        vin_match = re.search(r"[A-HJ-NPR-Z0-9]{17}", (filename or "").upper())
        if vin_match:
            vin = vin_match.group(0)
    if not vin:
        ref_match = re.search(r"\b(POL|FAC|BL|TIT|PER|CAR)-\d{4}-\d+\b", (filename or "").upper())
        if ref_match:
            vin = ref_match.group(0)

    tipo_titulo = merged.get("tipoTitulo")
    if not tipo_titulo and filename:
        lower = filename.lower()
        if "titulo" in lower or "title" in lower:
            tipo_titulo = "Clean Title"
        elif "factura" in lower or "fac-" in lower:
            tipo_titulo = "Factura comercial"
        elif "poliza" in lower or "pol-" in lower:
            tipo_titulo = "Póliza de importación"
        elif "bl" in lower or "lading" in lower:
            tipo_titulo = "Bill of Lading"
        elif "permiso" in lower or "per-" in lower:
            tipo_titulo = "Permiso fitosanitario"
        elif "carta" in lower or "car-" in lower:
            tipo_titulo = "Carta de porte"
    if not tipo_titulo:
        tipo_titulo = "En revisión OCR"

    propietario = merged.get("propietario", "Pendiente verificación manual")
    estado = merged.get("estado", "Documento escaneado")
    fecha = merged.get("fechaEmision", "Pendiente")

    campos_ok = sum(
        1
        for val in (propietario, vin, fecha, estado)
        if val
        and val not in ("Pendiente verificación manual", "No detectado", "Pendiente", "Documento escaneado")
    )
    if plain_text:
        confianza = max(confianza, 70.0 + campos_ok * 6)
    if html_fields:
        confianza = max(confianza, 88.0)
    if campos_ok >= 3:
        confianza = max(confianza, 92.0)

    return {
        "propietario": propietario,
        "vin": vin or "No detectado",
        "estado": estado,
        "fechaEmision": fecha,
        "tipoTitulo": tipo_titulo,
        "confianza": round(min(confianza, 98.0), 1),
        "calidadImagen": round(contrast, 1),
        "textoExtraido": bool(plain_text.strip()),
    }
