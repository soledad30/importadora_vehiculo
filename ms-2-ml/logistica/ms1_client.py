"""Cliente HTTP para leer/actualizar importaciones en MS-1."""

from datetime import date

import httpx
from django.conf import settings


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def listar_vehiculos(token: str) -> list[dict]:
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(f"{settings.MS1_API_URL}/vehiculos", headers=_headers(token))
        resp.raise_for_status()
        return resp.json()


def listar_pedidos(token: str) -> list[dict]:
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(f"{settings.MS1_API_URL}/pedidos", headers=_headers(token))
        resp.raise_for_status()
        return resp.json()


def listar_clientes(token: str) -> list[dict]:
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(f"{settings.MS1_API_URL}/clientes", headers=_headers(token))
        resp.raise_for_status()
        return resp.json()


def listar_importaciones(token: str) -> list[dict]:
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(f"{settings.MS1_API_URL}/importaciones", headers=_headers(token))
        resp.raise_for_status()
        return resp.json()


def obtener_importacion(importacion_id: int, token: str) -> dict:
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(
            f"{settings.MS1_API_URL}/importaciones/{importacion_id}",
            headers=_headers(token),
        )
        resp.raise_for_status()
        return resp.json()


def vincular_embarque_ms1(importacion: dict, embarque_id: str, token: str) -> None:
    """Actualiza ms2EmbarqueId en MS-1 conservando el resto de campos."""
    body = {
        "pedidoId": importacion["pedidoId"],
        "paisOrigen": importacion.get("paisOrigen") or "Estados Unidos",
        "aduana": importacion.get("aduana") or "Puerto Cortés",
        "puertoOrigen": importacion.get("puertoOrigen"),
        "puertoDestino": importacion.get("puertoDestino"),
        "naviera": importacion.get("naviera"),
        "numeroBl": importacion.get("numeroBl"),
        "numeroContenedor": importacion.get("numeroContenedor"),
        "numeroDespacho": importacion.get("numeroDespacho"),
        "estado": importacion.get("estado"),
        "fechaInicio": importacion.get("fechaInicio"),
        "fechaEstimadaEntrega": importacion.get("fechaEstimadaEntrega"),
        "ms2EmbarqueId": embarque_id,
    }
    with httpx.Client(timeout=10.0) as client:
        resp = client.put(
            f"{settings.MS1_API_URL}/importaciones/{importacion['id']}",
            headers=_headers(token),
            json=body,
        )
        resp.raise_for_status()


ETAPA_A_ESTADO_MS1 = {
    "COMPRADO": "SOLICITADA",
    "EMBARCADO": "EN_TRANSITO",
    "EN_TRANSITO": "EN_TRANSITO",
    "EN_ADUANA": "EN_ADUANA",
    "LIBERADO": "LIBERADA",
    "EN_LOTE": "COMPLETADA",
}


def actualizar_estado_ms1(importacion: dict, etapa: str, token: str) -> None:
    nuevo_estado = ETAPA_A_ESTADO_MS1.get(etapa)
    if not nuevo_estado or importacion.get("estado") == nuevo_estado:
        return
    body = {
        "pedidoId": importacion["pedidoId"],
        "paisOrigen": importacion.get("paisOrigen") or "Estados Unidos",
        "aduana": importacion.get("aduana") or "Puerto Cortés",
        "puertoOrigen": importacion.get("puertoOrigen"),
        "puertoDestino": importacion.get("puertoDestino"),
        "naviera": importacion.get("naviera"),
        "numeroBl": importacion.get("numeroBl"),
        "numeroContenedor": importacion.get("numeroContenedor"),
        "numeroDespacho": importacion.get("numeroDespacho"),
        "estado": nuevo_estado,
        "fechaInicio": importacion.get("fechaInicio") or str(date.today()),
        "fechaEstimadaEntrega": importacion.get("fechaEstimadaEntrega"),
        "ms2EmbarqueId": importacion.get("ms2EmbarqueId"),
    }
    with httpx.Client(timeout=10.0) as client:
        resp = client.put(
            f"{settings.MS1_API_URL}/importaciones/{importacion['id']}",
            headers=_headers(token),
            json=body,
        )
        resp.raise_for_status()
