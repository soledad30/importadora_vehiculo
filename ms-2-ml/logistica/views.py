from rest_framework.decorators import api_view
from rest_framework.exceptions import AuthenticationFailed, NotFound
from rest_framework.response import Response

from .auth import user_from_bearer
from .data import PROVEEDORES
from .models import BlockchainEvento, CotizacionHistorial, Embarque
from . import ml_engine, services, rastreo


def _require_auth(request):
    try:
        return user_from_bearer(request.headers.get("Authorization"))
    except AuthenticationFailed as exc:
        raise exc


def _token(request) -> str:
    return request.headers.get("Authorization", "")


@api_view(["GET"])
def health(_request):
    return Response({"status": "UP", "service": "ms-2-ml", "version": "0.2.0"})


@api_view(["GET"])
def embarques(request):
    _require_auth(request)
    services.seed_embarques_si_vacio()
    token = _token(request)
    if token:
        services.sincronizar_desde_ms1(token.replace("Bearer ", ""))
    items = Embarque.objects.all()
    return Response([e.to_dict() for e in items])


@api_view(["GET"])
def embarque_rastreo(request, embarque_id: int):
    _require_auth(request)
    services.seed_embarques_si_vacio()
    emb = Embarque.objects.filter(pk=embarque_id).first()
    if not emb:
        raise NotFound("Embarque no encontrado")
    return Response(rastreo.calcular_rastreo(emb))


@api_view(["POST"])
def embarque_avanzar(request, embarque_id: int):
    _require_auth(request)
    emb = Embarque.objects.filter(pk=embarque_id).first()
    if not emb:
        raise NotFound("Embarque no encontrado")
    token = _token(request).replace("Bearer ", "")
    services.avanzar_etapa(emb, token)
    return Response(emb.to_dict())


@api_view(["POST"])
def embarques_desde_lote(request):
    """Sincroniza un lote MS-1 como embarque consolidado en MS-2."""
    _require_auth(request)
    data = request.data or {}
    emb = services.sincronizar_lote_desde_ms1(data)
    if not emb:
        return Response({"detail": "Lote inválido"}, status=400)
    return Response(emb)


@api_view(["POST"])
def embarques_planificar(request):
    _require_auth(request)
    data = request.data or {}
    creados = services.planificar_embarques(
        marca=data.get("marca", "Toyota"),
        modelo=data.get("modelo", ""),
        cantidad=data.get("cantidad", 1),
        origen=data.get("origen", "Miami, FL"),
        destino=data.get("destino", "Puerto Cortés, HN"),
        naviera=data.get("naviera", "Por asignar"),
    )
    return Response({"creados": len(creados), "embarques": creados})


@api_view(["GET"])
def importaciones_resumen(request):
    _require_auth(request)
    services.seed_embarques_si_vacio()
    return Response(services.resumen_importaciones())


@api_view(["GET"])
def proximas_llegadas(request):
    _require_auth(request)
    services.seed_embarques_si_vacio()
    return Response(services.proximas_llegadas())


@api_view(["POST"])
def cotizador_calcular(request):
    _require_auth(request)
    data = request.data
    precio = float(data.get("precioCompra", 0))
    vehiculo = data.get("tipoVehiculo", "Vehículo") + f" {data.get('anio', '')}".strip()
    flete = 1850
    seguro = precio * 0.015
    cif = precio + flete + seguro
    dai = cif * 0.15
    isc = cif * 0.1
    iva = (cif + dai + isc) * 0.15
    atp = cif * 0.01
    transporte = 450
    tramites = 380
    total = cif + dai + isc + iva + atp + transporte + tramites
    margen = 30
    impuestos = dai + isc + iva + atp
    venta = round(total * 1.3, 2)

    CotizacionHistorial.objects.create(
        vehiculo=vehiculo,
        cif=round(cif, 2),
        impuestos=round(impuestos, 2),
        total=round(total, 2),
        margen=margen,
        venta=venta,
    )

    return Response({
        "precioFob": precio,
        "fleteMaritimo": flete,
        "seguro": seguro,
        "valorCif": cif,
        "dai": dai,
        "isc": isc,
        "iva": iva,
        "atp": atp,
        "transporteInterno": transporte,
        "tramitesAduaneros": tramites,
        "costoTotal": round(total, 2),
        "margenPorcentaje": margen,
        "precioSugeridoVenta": venta,
    })


@api_view(["GET"])
def cotizador_recientes(request):
    _require_auth(request)
    services.seed_cotizaciones_si_vacio()
    return Response([c.to_dict() for c in CotizacionHistorial.objects.all()[:10]])


@api_view(["GET"])
def proveedores_lista(request):
    _require_auth(request)
    return Response(PROVEEDORES)


@api_view(["GET"])
def proveedores_resumen(request):
    _require_auth(request)
    return Response(services.proveedores_resumen())


@api_view(["GET"])
def blockchain_historial(request, vin=None):
    _require_auth(request)
    path_vin = vin
    q_vin = request.query_params.get("vin") or path_vin
    from . import blockchain_service

    data = blockchain_service.blockchain_historial(
        vin=q_vin,
        tipo=request.query_params.get("tipo"),
        desde=request.query_params.get("desde"),
        hasta=request.query_params.get("hasta"),
        red=request.query_params.get("red"),
        estado=request.query_params.get("estado"),
    )
    return Response(data)


@api_view(["POST"])
def blockchain_registrar(request):
    user = _require_auth(request)
    data = request.data
    vin = (data.get("vin") or "").strip().upper()
    if not vin:
        return Response({"detail": "VIN requerido"}, status=400)
    evento = data.get("evento") or "REGISTRO"
    descripcion = data.get("descripcion") or ""
    registrado = user.get("sub") or user.get("username") or "MS-1"
    reg = BlockchainEvento.objects.create(
        vin=vin,
        evento=evento,
        descripcion=descripcion,
        registrado_por=str(registrado),
    )
    return Response(reg.to_dict(), status=201)


@api_view(["GET"])
def ml_prediccion_demanda(request):
    _require_auth(request)
    meses = int(request.query_params.get("meses", 3))
    token = _token(request).replace("Bearer ", "")
    return Response(ml_engine.prediccion_demanda(token, meses=max(1, min(meses, 12))))


@api_view(["GET"])
def ml_segmentacion_clientes(request):
    _require_auth(request)
    token = _token(request).replace("Bearer ", "")
    return Response(ml_engine.segmentacion_clientes(token))


@api_view(["GET"])
def ml_anomalias(request):
    _require_auth(request)
    token = _token(request).replace("Bearer ", "")
    return Response(ml_engine.deteccion_anomalias(token))


@api_view(["GET"])
def ml_analisis_historico(request):
    _require_auth(request)
    token = _token(request).replace("Bearer ", "")
    return Response(ml_engine.analisis_historico(token))
