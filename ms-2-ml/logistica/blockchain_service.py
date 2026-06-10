"""Cadena de custodia blockchain — agrupación y filtros."""

from __future__ import annotations

import copy
import hashlib

from .data import BLOCKCHAIN_CATALOGO
from .models import BlockchainEvento

TIPOS_EVENTO = ("ORIGEN", "EMBARQUE", "TRANSITO", "ADUANA", "LIBERACION", "ENTREGA")


def _infer_tipo(evento: str) -> str:
    upper = (evento or "").upper()
    for key in TIPOS_EVENTO:
        if key in upper:
            return key
    return "ORIGEN"


def _tx_hash(vin: str, salt: str = "") -> str:
    digest = hashlib.sha256(f"{vin}{salt}".encode()).hexdigest()
    return f"0x{digest[:8]}...{digest[-4:]}"


def _vehiculo_desde_registro(vin: str) -> dict:
    return {
        "titulo": f"Vehículo {vin}",
        "vin": vin,
        "blockchainId": _tx_hash(vin, "id"),
        "red": "Ethereum",
        "eventos": [],
        "ultimoTxHash": _tx_hash(vin, "tx"),
        "block": "#—",
        "gas": "0.002 ETH",
        "confirmaciones": 24,
    }


def _merge_db_eventos(catalogo: list[dict]) -> list[dict]:
    by_vin: dict[str, dict] = {item["vin"].upper(): copy.deepcopy(item) for item in catalogo}

    for reg in BlockchainEvento.objects.all().order_by("creado_en"):
        vin = reg.vin.upper()
        if vin not in by_vin:
            by_vin[vin] = _vehiculo_desde_registro(vin)

        by_vin[vin]["eventos"].append(
            {
                "fecha": reg.creado_en.strftime("%Y-%m-%d"),
                "titulo": reg.evento,
                "detalle": reg.descripcion or f"Registrado por {reg.registrado_por or 'MS-2'}",
                "tipo": _infer_tipo(reg.evento),
            }
        )
        by_vin[vin]["ultimoTxHash"] = _tx_hash(vin, reg.evento)

    for item in by_vin.values():
        item["eventos"].sort(key=lambda e: e.get("fecha", ""))
    return list(by_vin.values())


def _tiene_entrega(item: dict) -> bool:
    return any(e.get("tipo") == "ENTREGA" for e in item.get("eventos", []))


def blockchain_historial(
    vin: str | None = None,
    tipo: str | None = None,
    desde: str | None = None,
    hasta: str | None = None,
    red: str | None = None,
    estado: str | None = None,
) -> list[dict]:
    items = _merge_db_eventos(BLOCKCHAIN_CATALOGO)

    if vin:
        needle = vin.strip().upper()
        items = [
            i
            for i in items
            if needle in i["vin"].upper()
            or needle in i.get("ultimoTxHash", "").upper()
            or needle in i.get("titulo", "").upper()
        ]

    if red and red.upper() != "TODOS":
        items = [i for i in items if i.get("red", "").upper() == red.upper()]

    if estado == "COMPLETA":
        items = [i for i in items if _tiene_entrega(i)]
    elif estado == "EN_PROCESO":
        items = [i for i in items if not _tiene_entrega(i)]

    if tipo and tipo.upper() != "TODOS":
        tipo_u = tipo.upper()
        items = [
            i
            for i in items
            if any(e.get("tipo") == tipo_u for e in i.get("eventos", []))
        ]

    if desde or hasta:
        filtered = []
        for item in items:
            eventos = item.get("eventos", [])
            if desde:
                eventos = [e for e in eventos if e.get("fecha", "") >= desde]
            if hasta:
                eventos = [e for e in eventos if e.get("fecha", "") <= hasta]
            if eventos:
                copy_item = copy.deepcopy(item)
                copy_item["eventos"] = eventos
                filtered.append(copy_item)
        items = filtered

    if tipo and tipo.upper() != "TODOS":
        tipo_u = tipo.upper()
        for item in items:
            item["eventos"] = [e for e in item["eventos"] if e.get("tipo") == tipo_u]

    items.sort(key=lambda i: i.get("eventos", [{}])[-1].get("fecha", ""), reverse=True)
    return items
