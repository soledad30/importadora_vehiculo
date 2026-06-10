from datetime import date, timedelta

from .data import EMBARQUES, PROVEEDORES
from .models import CotizacionHistorial, Embarque
from . import ms1_client

ETAPA_INDEX = {e: i for i, e in enumerate(Embarque.ETAPAS)}


LOTE_A_ETAPA = {
    "PLANIFICADO": "COMPRADO",
    "EMBARCADO": "EMBARCADO",
    "EN_TRANSITO": "EN_TRANSITO",
    "EN_ADUANA": "EN_ADUANA",
    "LIBERADO": "LIBERADO",
    "EN_PATIO": "EN_LOTE",
}


def sincronizar_lote_desde_ms1(lote: dict) -> dict:
    """Crea o actualiza embarque MS-2 vinculado a un lote MS-1."""
    lote_id = lote.get("id")
    if not lote_id:
        return {}

    emb = Embarque.objects.filter(ms1_lote_id=lote_id).first()
    etapa = LOTE_A_ETAPA.get(lote.get("estado") or "PLANIFICADO", "COMPRADO")
    vehiculos = lote.get("cantidadVehiculos") or 0
    referencia = f"Contenedor: {lote.get('numeroContenedor') or '—'} · {vehiculos} VIN(s)"

    if emb:
        emb.etapa_actual = etapa
        emb.naviera = lote.get("naviera") or emb.naviera
        emb.origen = lote.get("puertoOrigen") or emb.origen
        emb.destino = lote.get("puertoDestino") or emb.destino
        emb.referencia = referencia
        emb.save(update_fields=["etapa_actual", "naviera", "origen", "destino", "referencia"])
        return emb.to_dict()

    emb = Embarque.objects.create(
        ms1_lote_id=lote_id,
        codigo=lote.get("codigo") or f"LOT-{lote_id:03d}",
        vehiculo=f"Lote {lote.get('codigo') or lote_id} ({vehiculos} veh.)",
        referencia=referencia,
        origen=lote.get("puertoOrigen") or "Miami, FL",
        destino=lote.get("puertoDestino") or "Puerto Cortés, HN",
        naviera=lote.get("naviera") or "",
        etapa_actual=etapa,
        fecha_estimada=lote.get("fechaEmbarque"),
    )
    return emb.to_dict()


def avanzar_embarque_lote(ms1_lote_id: int, etapa: str) -> Embarque | None:
    emb = Embarque.objects.filter(ms1_lote_id=ms1_lote_id).first()
    if not emb:
        return None
    emb.etapa_actual = etapa
    emb.save(update_fields=["etapa_actual"])
    return emb


def _estado_a_etapa(estado_ms1: str | None) -> str:
    mapping = {
        "SOLICITADA": "COMPRADO",
        "EN_TRANSITO": "EN_TRANSITO",
        "EN_ADUANA": "EN_ADUANA",
        "LIBERADA": "LIBERADO",
        "COMPLETADA": "EN_LOTE",
    }
    return mapping.get(estado_ms1 or "", "COMPRADO")


def sincronizar_desde_ms1(token: str) -> int:
    """Crea embarques locales a partir de importaciones MS-1 sin embarque vinculado."""
    try:
        importaciones = ms1_client.listar_importaciones(token)
    except Exception:
        return 0

    creados = 0
    for imp in importaciones:
        if imp.get("ms2EmbarqueId"):
            continue
        if Embarque.objects.filter(ms1_importacion_id=imp["id"]).exists():
            continue
        emb = Embarque.objects.create(
            ms1_importacion_id=imp["id"],
            codigo=imp.get("codigo") or f"IMP-{imp['id']:03d}",
            vehiculo=imp.get("vehiculoTitulo") or f"Importación {imp['id']}",
            referencia=f"VIN: {imp.get('vehiculoVin')}" if imp.get("vehiculoVin") else "",
            origen=imp.get("puertoOrigen") or imp.get("paisOrigen") or "",
            destino=imp.get("puertoDestino") or imp.get("aduana") or "",
            naviera=imp.get("naviera") or "",
            etapa_actual=_estado_a_etapa(imp.get("estado")),
            fecha_estimada=imp.get("fechaEstimadaEntrega"),
        )
        try:
            ms1_client.vincular_embarque_ms1(imp, str(emb.pk), token)
        except Exception:
            pass
        creados += 1
    return creados


def seed_embarques_si_vacio() -> None:
    if Embarque.objects.exists():
        return
    for item in EMBARQUES:
        Embarque.objects.create(
            codigo=item["codigo"],
            vehiculo=item["vehiculo"],
            referencia=item["referencia"],
            origen=item["origen"],
            destino=item["destino"],
            naviera=item["naviera"],
            etapa_actual=item["etapaActual"],
        )


def seed_cotizaciones_si_vacio() -> None:
    if CotizacionHistorial.objects.exists():
        return
    CotizacionHistorial.objects.bulk_create([
        CotizacionHistorial(vehiculo="Toyota RAV4 2024", cif=13887, impuestos=6454, total=22479, margen=30, venta=29223),
        CotizacionHistorial(vehiculo="Honda CR-V 2023", cif=12450, impuestos=5780, total=20120, margen=28, venta=25754),
        CotizacionHistorial(vehiculo="Nissan Rogue 2024", cif=13100, impuestos=6100, total=21350, margen=30, venta=27755),
    ])


def resumen_importaciones() -> dict:
    qs = Embarque.objects.all()
    return {
        "enTransito": qs.filter(etapa_actual__in=["COMPRADO", "EMBARCADO", "EN_TRANSITO"]).count(),
        "enAduana": qs.filter(etapa_actual="EN_ADUANA").count(),
        "pendientePago": qs.filter(etapa_actual="LIBERADO").count(),
        "completadasMes": qs.filter(etapa_actual="EN_LOTE").count(),
    }


def proximas_llegadas() -> list[dict]:
    hoy = date.today()
    items = []
    for emb in Embarque.objects.exclude(etapa_actual="EN_LOTE")[:5]:
        fecha = emb.fecha_estimada or (hoy + timedelta(days=7))
        dias = max((fecha - hoy).days, 0) if isinstance(fecha, date) else 7
        items.append({
            "codigo": emb.codigo.replace("IMP-2025-", "IMP-"),
            "vehiculo": emb.vehiculo.split()[0:2] and " ".join(emb.vehiculo.split()[:2]) or emb.vehiculo,
            "fecha": fecha.isoformat() if hasattr(fecha, "isoformat") else str(fecha),
            "diasRestantes": dias,
        })
    return items


def avanzar_etapa(embarque: Embarque, token: str | None) -> Embarque:
    idx = ETAPA_INDEX.get(embarque.etapa_actual, 0)
    if idx < len(Embarque.ETAPAS) - 1:
        embarque.etapa_actual = Embarque.ETAPAS[idx + 1]
        embarque.save(update_fields=["etapa_actual"])
        if token and embarque.ms1_importacion_id:
            try:
                imp = ms1_client.obtener_importacion(embarque.ms1_importacion_id, token)
                ms1_client.actualizar_estado_ms1(imp, embarque.etapa_actual, token)
            except Exception:
                pass
    return embarque


def planificar_embarques(
    marca: str,
    modelo: str,
    cantidad: int,
    origen: str = "Miami, FL",
    destino: str = "Puerto Cortés, HN",
    naviera: str = "Por asignar",
) -> list[dict]:
    """Crea embarques en etapa COMPRADO a partir de una recomendación ML."""
    cantidad = max(1, min(int(cantidad or 1), 20))
    vehiculo = f"{marca} {modelo}".strip()
    creados: list[dict] = []
    seq = Embarque.objects.count()
    for i in range(cantidad):
        seq += 1
        codigo = f"PLAN-{date.today().strftime('%Y%m%d')}-{seq:03d}"
        emb = Embarque.objects.create(
            codigo=codigo,
            vehiculo=vehiculo,
            referencia=f"Plan ML — unidad {i + 1}/{cantidad}",
            origen=origen,
            destino=destino,
            naviera=naviera,
            etapa_actual="COMPRADO",
            fecha_estimada=date.today() + timedelta(days=45),
        )
        creados.append(emb.to_dict())
    return creados


def proveedores_resumen() -> dict:
    subastas = sum(1 for p in PROVEEDORES if p["tipo"] == "SUBASTA")
    navieras = sum(1 for p in PROVEEDORES if p["tipo"] == "NAVIERA")
    dealers = sum(1 for p in PROVEEDORES if p["tipo"] == "DEALER")
    agentes = sum(1 for p in PROVEEDORES if p["tipo"] == "AGENTE")
    return {"subastas": subastas, "navieras": navieras, "dealers": dealers, "agentes": agentes}
