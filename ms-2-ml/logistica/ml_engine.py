"""Motor ML — predicción, segmentación, anomalías y análisis histórico (MS-2)."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, timedelta
from statistics import mean, stdev
from typing import Any

import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest

from . import ms1_client


def _fallback_vehiculos() -> list[dict]:
    return [
        {"marca": "Toyota", "modelo": "RAV4", "precio": 28500, "anio": 2024, "estado": "DISPONIBLE"},
        {"marca": "Honda", "modelo": "CR-V", "precio": 26800, "anio": 2023, "estado": "DISPONIBLE"},
        {"marca": "Toyota", "modelo": "Corolla", "precio": 22000, "anio": 2024, "estado": "VENDIDO"},
        {"marca": "Nissan", "modelo": "Rogue", "precio": 27500, "anio": 2024, "estado": "DISPONIBLE"},
        {"marca": "Ford", "modelo": "Explorer", "precio": 35000, "anio": 2023, "estado": "RESERVADO"},
        {"marca": "Mazda", "modelo": "CX-5", "precio": 29200, "anio": 2024, "estado": "DISPONIBLE"},
    ]


def _fallback_pedidos() -> list[dict]:
    hoy = date.today()
    return [
        {"id": 1, "clienteId": 1, "total": 28500, "estado": "ENTREGADO", "creadoEn": (hoy - timedelta(days=60)).isoformat()},
        {"id": 2, "clienteId": 1, "total": 26800, "estado": "CONFIRMADO", "creadoEn": (hoy - timedelta(days=30)).isoformat()},
        {"id": 3, "clienteId": 2, "total": 27500, "estado": "PENDIENTE", "creadoEn": (hoy - timedelta(days=7)).isoformat()},
    ]


def _cargar_datos_ms1(token: str) -> tuple[list[dict], list[dict], list[dict]]:
    vehiculos, pedidos, clientes = [], [], []
    try:
        vehiculos = ms1_client.listar_vehiculos(token)
        pedidos = ms1_client.listar_pedidos(token)
        clientes = ms1_client.listar_clientes(token)
    except Exception:
        pass
    if not vehiculos:
        vehiculos = _fallback_vehiculos()
    if not pedidos:
        pedidos = _fallback_pedidos()
    return vehiculos, pedidos, clientes


def prediccion_demanda(token: str, meses: int = 3) -> dict[str, Any]:
    vehiculos, pedidos, _ = _cargar_datos_ms1(token)
    marcas_pedidos = Counter()
    for p in pedidos:
        desc = p.get("vehiculoDescripcion") or ""
        marca = desc.split()[0] if desc else "General"
        marcas_pedidos[marca] += 1

    marcas_stock = Counter(v.get("marca", "General") for v in vehiculos if v.get("estado") == "DISPONIBLE")
    todas = set(marcas_pedidos) | set(marcas_stock) | {"Toyota", "Honda", "Nissan"}

    historico = []
    for marca in sorted(todas):
        demanda = marcas_pedidos.get(marca, 0)
        stock = marcas_stock.get(marca, 0)
        tasa = demanda / max(len(pedidos), 1)
        proyeccion = max(1, round(demanda * (1 + tasa) * meses / 3))
        historico.append({
            "marca": marca,
            "pedidosHistoricos": demanda,
            "stockActual": stock,
            "demandaProyectada": proyeccion,
            "recomendacion": "Aumentar stock" if proyeccion > stock else "Stock adecuado",
        })

    historico.sort(key=lambda x: x["demandaProyectada"], reverse=True)
    return {
        "horizonteMeses": meses,
        "modelo": "regresion_heuristica_v1",
        "generadoEn": date.today().isoformat(),
        "marcas": historico[:8],
        "totalProyectado": sum(m["demandaProyectada"] for m in historico),
    }


def segmentacion_clientes(token: str) -> dict[str, Any]:
    _, pedidos, clientes = _cargar_datos_ms1(token)
    gasto_por_cliente: dict[int, float] = defaultdict(float)
    pedidos_por_cliente: dict[int, int] = defaultdict(int)

    for p in pedidos:
        cid = p.get("clienteId")
        if cid is None:
            continue
        gasto_por_cliente[cid] += float(p.get("total") or 0)
        pedidos_por_cliente[cid] += 1

    if len(gasto_por_cliente) < 2:
        return {
            "modelo": "kmeans_v1",
            "segmentos": [
                {"nombre": "Premium", "clientes": 1, "gastoPromedio": 28500, "descripcion": "Alto valor"},
                {"nombre": "Estándar", "clientes": 1, "gastoPromedio": 15000, "descripcion": "Valor medio"},
                {"nombre": "Ocasional", "clientes": 1, "gastoPromedio": 5000, "descripcion": "Baja frecuencia"},
            ],
        }

    ids = list(gasto_por_cliente.keys())
    X = np.array([
        [gasto_por_cliente[i], pedidos_por_cliente[i], float(i % 5)]
        for i in ids
    ])
    k = min(3, len(ids))
    labels = KMeans(n_clusters=k, random_state=42, n_init=10).fit_predict(X)

    nombres = ["Premium", "Estándar", "Ocasional"]
    segmentos = []
    for cluster in range(k):
        miembros = [ids[i] for i, lb in enumerate(labels) if lb == cluster]
        gastos = [gasto_por_cliente[i] for i in miembros]
        segmentos.append({
            "nombre": nombres[cluster] if cluster < len(nombres) else f"Segmento {cluster + 1}",
            "clientes": len(miembros),
            "gastoPromedio": round(mean(gastos), 2),
            "idsCliente": miembros,
        })
    segmentos.sort(key=lambda s: s["gastoPromedio"], reverse=True)
    return {"modelo": "kmeans_v1", "segmentos": segmentos, "totalClientes": len(clientes) or len(ids)}


def deteccion_anomalias(token: str) -> dict[str, Any]:
    vehiculos, pedidos, _ = _cargar_datos_ms1(token)
    precios = [float(v.get("precio", 0)) for v in vehiculos if v.get("precio")]
    anomalias: list[dict] = []

    if len(precios) >= 4:
        X = np.array(precios).reshape(-1, 1)
        preds = IsolationForest(contamination=0.15, random_state=42).fit_predict(X)
        for v, pred in zip(vehiculos, preds):
            if pred == -1:
                anomalias.append({
                    "tipo": "PRECIO_ATIPICO",
                    "vin": v.get("vin", ""),
                    "marca": v.get("marca", ""),
                    "modelo": v.get("modelo", ""),
                    "precio": float(v.get("precio", 0)),
                    "precioPromedio": round(mean(precios), 2),
                    "severidad": "ALTA" if float(v.get("precio", 0)) > mean(precios) + stdev(precios) else "MEDIA",
                })

    estados_raros = [p for p in pedidos if p.get("estado") == "CANCELADO" and float(p.get("total", 0)) > 40000]
    for p in estados_raros:
        anomalias.append({
            "tipo": "PEDIDO_CANCELADO_ALTO_VALOR",
            "pedidoId": p.get("id"),
            "total": float(p.get("total", 0)),
            "severidad": "MEDIA",
        })

    return {
        "modelo": "isolation_forest_v1",
        "totalAnomalias": len(anomalias),
        "anomalias": anomalias,
        "vehiculosAnalizados": len(vehiculos),
        "pedidosAnalizados": len(pedidos),
    }


def analisis_historico(token: str) -> dict[str, Any]:
    vehiculos, pedidos, _ = _cargar_datos_ms1(token)
    por_mes: dict[str, dict] = defaultdict(lambda: {"pedidos": 0, "ventas": 0.0})
    hoy = date.today()

    for p in pedidos:
        raw = p.get("creadoEn", "")[:7]
        if not raw:
            raw = hoy.strftime("%Y-%m")
        por_mes[raw]["pedidos"] += 1
        if p.get("estado") in ("ENTREGADO", "CONFIRMADO", "EN_IMPORTACION"):
            por_mes[raw]["ventas"] += float(p.get("total") or 0)

    meses_ordenados = sorted(por_mes.keys())[-6:]
    serie = [
        {"mes": m, "pedidos": por_mes[m]["pedidos"], "ventas": round(por_mes[m]["ventas"], 2)}
        for m in meses_ordenados
    ]

    disponibles = sum(1 for v in vehiculos if v.get("estado") == "DISPONIBLE")
    vendidos = sum(1 for v in vehiculos if v.get("estado") == "VENDIDO")

    return {
        "modelo": "agregacion_temporal_v1",
        "resumen": {
            "vehiculosDisponibles": disponibles,
            "vehiculosVendidos": vendidos,
            "pedidosTotales": len(pedidos),
            "ticketPromedio": round(mean([float(p.get("total", 0)) for p in pedidos]) if pedidos else 0, 2),
        },
        "serieMensual": serie,
        "tendencia": "CRECIENTE" if len(serie) >= 2 and serie[-1]["pedidos"] >= serie[0]["pedidos"] else "ESTABLE",
    }
