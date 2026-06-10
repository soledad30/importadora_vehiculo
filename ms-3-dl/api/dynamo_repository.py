"""Repositorio DynamoDB — documentos e inspecciones (MS-3)."""

import json
import os
import uuid
from datetime import date, datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from storage import presigned_url

DYNAMODB_ENDPOINT = os.getenv("DYNAMODB_ENDPOINT", "http://localhost:8000")
DYNAMODB_REGION = os.getenv("DYNAMODB_REGION", "us-east-1")
TABLE_DOCUMENTOS = os.getenv("DYNAMODB_TABLE_DOCUMENTOS", "ms3-documentos")
TABLE_INSPECCIONES = os.getenv("DYNAMODB_TABLE_INSPECCIONES", "ms3-inspecciones")


def _resource():
    return boto3.resource(
        "dynamodb",
        endpoint_url=DYNAMODB_ENDPOINT,
        region_name=DYNAMODB_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "local"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "local"),
    )


def _to_json(obj):
    if isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    if isinstance(obj, list):
        return [_to_json(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _to_json(v) for k, v in obj.items()}
    return obj


def ensure_tables() -> None:
    client = boto3.client(
        "dynamodb",
        endpoint_url=DYNAMODB_ENDPOINT,
        region_name=DYNAMODB_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "local"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "local"),
    )
    existing = client.list_tables().get("TableNames", [])

    if TABLE_DOCUMENTOS not in existing:
        client.create_table(
            TableName=TABLE_DOCUMENTOS,
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )

    if TABLE_INSPECCIONES not in existing:
        client.create_table(
            TableName=TABLE_INSPECCIONES,
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "id", "AttributeType": "S"},
                {"AttributeName": "activa", "AttributeType": "S"},
                {"AttributeName": "fecha", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "activa-fecha-index",
                    "KeySchema": [
                        {"AttributeName": "activa", "KeyType": "HASH"},
                        {"AttributeName": "fecha", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        waiter = client.get_waiter("table_exists")
        waiter.wait(TableName=TABLE_INSPECCIONES)


def seed_if_empty() -> None:
    if list_documentos():
        return
    today = date.today().isoformat()
    docs = [
        ("TIT-2025-0034.pdf", "Toyota RAV4 2024", "2T3P1RFV5RC123456", "Titulo", "2025-01-10", "VERIFICADO"),
        ("FAC-2025-0089.pdf", "Honda CR-V 2023", "1HGBH41JXMN109186", "Factura", "2025-01-09", "PENDIENTE"),
        ("BL-2025-0045.pdf", "Nissan Rogue 2024", "1N4BL4BV5RC123456", "BL", "2025-01-08", "VERIFICADO"),
        ("POL-2025-0012.pdf", "Mazda CX-5 2024", "JM3KFBDM5K0123456", "Poliza", "2025-01-07", "VERIFICADO"),
        ("TIT-2025-0021.pdf", "Ford Explorer 2023", "1FM5K8D85HGA12345", "Titulo", "2025-01-06", "PENDIENTE"),
    ]
    ocr_ejemplos = {
        "TIT-2025-0034.pdf": {
            "propietario": "John Smith", "vin": "2T3P1RFV5RC123456",
            "estado": "Texas, USA", "fechaEmision": "2024-07-20",
            "tipoTitulo": "Clean Title", "confianza": 96.5,
        },
        "FAC-2025-0089.pdf": {
            "propietario": "AutoNation Dealer", "vin": "1HGBH41JXMN109186",
            "estado": "Factura comercial", "fechaEmision": "2025-01-09",
            "tipoTitulo": "FOB $22,500", "confianza": 88.0,
        },
        "BL-2025-0045.pdf": {
            "propietario": "Evergreen Line", "vin": "1N4BL4BV5RC123456",
            "estado": "Houston → Corinto", "fechaEmision": "2025-01-08",
            "tipoTitulo": "BL EGLV089234", "confianza": 79.5,
        },
    }
    for nombre, vehiculo, vin, tipo, fecha, estado in docs:
        save_documento({
            "nombre": nombre,
            "vehiculo": vehiculo,
            "vin": vin,
            "tipo": tipo,
            "fecha": fecha,
            "estado": estado,
            "s3_key": "",
            "ocr": ocr_ejemplos.get(nombre),
        })

    if get_inspeccion_activa():
        return

    save_inspeccion({
        "vehiculo": "Toyota RAV4 2024",
        "vin": "2T3P1RFV5RC123456",
        "fecha": "2025-01-15",
        "modelo_detectado": "Toyota RAV4 XLE 2024",
        "confianza_modelo": 98.7,
        "danos_detectados": 2,
        "severidad": "Moderada",
        "costo_reparacion": 1200,
        "danos": [
            {"zona": "Parachoques Frontal", "tipo": "Abolladura", "severidad": "Moderada", "confianza": 96.2, "reparacion": 800},
            {"zona": "Puerta izquierda", "tipo": "Rayadura", "severidad": "Leve", "confianza": 91.5, "reparacion": 400},
        ],
        "ocr": {
            "propietario": "John Smith",
            "vin": "2T3P1RFV5RC123456",
            "estado": "Texas, USA",
            "fechaEmision": "2024-07-20",
            "tipoTitulo": "Clean Title",
        },
        "resultado": "2 daños detectados",
        "activa": True,
        "s3_key": "",
    })
    for vehiculo, vin, resultado, fecha in [
        ("Honda CR-V 2023", "1HGBH41JXMN109186", "Sin daños", "2025-01-14"),
        ("Nissan Rogue 2024", "1N4BL4BV5RC123456", "3 daños detectados", "2025-01-13"),
    ]:
        save_inspeccion({
            "vehiculo": vehiculo,
            "vin": vin,
            "fecha": fecha,
            "modelo_detectado": vehiculo,
            "confianza_modelo": 93.0,
            "danos_detectados": 0,
            "severidad": "Sin daños",
            "costo_reparacion": 0,
            "danos": [],
            "ocr": None,
            "resultado": resultado,
            "activa": False,
            "s3_key": "",
        })


def _doc_table():
    return _resource().Table(TABLE_DOCUMENTOS)


def _ins_table():
    return _resource().Table(TABLE_INSPECCIONES)


def list_documentos() -> list[dict]:
    items = _doc_table().scan().get("Items", [])
    items.sort(key=lambda x: (x.get("fecha", ""), x.get("id", "")), reverse=True)
    return [_doc_to_api(_to_json(i)) for i in items]


def resumen_documentos() -> dict:
    docs = list_documentos()
    return {
        "total": len(docs),
        "pendientes": sum(1 for d in docs if d["estado"] == "PENDIENTE"),
        "porVencer": sum(1 for d in docs if d["estado"] == "EN_REVISION"),
        "verificados": sum(1 for d in docs if d["estado"] == "VERIFICADO"),
    }


def resumen_reporte_documentos(categorias_def: list[tuple]) -> dict:
    items = _doc_table().scan().get("Items", [])
    docs = [_doc_to_api(_to_json(i)) for i in items]
    total = len(docs)
    verificados = sum(1 for d in docs if d["estado"] == "VERIFICADO")
    en_revision = sum(1 for d in docs if d["estado"] == "EN_REVISION")
    pendientes = sum(1 for d in docs if d["estado"] == "PENDIENTE")
    sin_archivo = sum(1 for i in items if not i.get("s3_key"))
    por_tipo = []
    for nombre, tipo, _icono in categorias_def:
        tipo_docs = [d for d in docs if d["tipo"] == tipo]
        por_tipo.append({
            "tipo": tipo,
            "nombre": nombre,
            "total": len(tipo_docs),
            "verificados": sum(1 for d in tipo_docs if d["estado"] == "VERIFICADO"),
            "sinArchivo": sum(
                1 for i in items
                if _to_json(i).get("tipo") == tipo and not i.get("s3_key")
            ),
        })
    return {
        "total": total,
        "verificados": verificados,
        "enRevision": en_revision,
        "pendientes": pendientes,
        "sinArchivo": sin_archivo,
        "completitudPct": round((verificados / total) * 100, 1) if total else 0.0,
        "porTipo": por_tipo,
    }


def resumen_reporte_inspeccion() -> dict:
    items = _ins_table().scan().get("Items", [])
    total = len(items)
    con_danos = sum(1 for i in items if int(i.get("danos_detectados") or 0) > 0)
    sin_danos = total - con_danos
    costo_total = sum(int(i.get("costo_reparacion") or 0) for i in items)
    severidad_counts: dict[str, int] = {}
    for item in items:
        sev = str(item.get("severidad") or "Sin daños")
        severidad_counts[sev] = severidad_counts.get(sev, 0) + 1
    recientes = sorted(items, key=lambda x: x.get("fecha", ""), reverse=True)[:5]
    ultimas = [
        {
            "vehiculo": i.get("vehiculo", ""),
            "vin": i.get("vin", ""),
            "fecha": i.get("fecha", ""),
            "resultado": i.get("resultado", ""),
            "danosDetectados": int(i.get("danos_detectados") or 0),
            "costoReparacion": int(i.get("costo_reparacion") or 0),
            "severidad": i.get("severidad", "Sin daños"),
        }
        for i in recientes
    ]
    return {
        "totalInspecciones": total,
        "conDanos": con_danos,
        "sinDanos": sin_danos,
        "costoReparacionEstimado": costo_total,
        "porSeveridad": severidad_counts,
        "ultimasInspecciones": ultimas,
    }


def categorias_documentos(categorias_def: list[tuple]) -> list[dict]:
    docs = list_documentos()
    result = []
    for nombre, tipo, icono in categorias_def:
        cantidad = sum(1 for d in docs if d["tipo"] == tipo)
        result.append({"nombre": nombre, "cantidad": cantidad, "icono": icono})
    return result


def save_documento(data: dict) -> dict:
    doc_id = data.get("id") or str(uuid.uuid4())
    num_id = data.get("num_id") or int(uuid.uuid4().int % 999_999) + 1
    vin = (data.get("vin") or "").upper().strip()
    if not vin and data.get("ocr"):
        vin = (data["ocr"].get("vin") or "").upper().strip()
    item = {
        "id": doc_id,
        "num_id": num_id,
        "nombre": data["nombre"],
        "vehiculo": data["vehiculo"],
        "vin": vin,
        "tipo": data["tipo"],
        "fecha": data.get("fecha", date.today().isoformat()),
        "estado": data.get("estado", "PENDIENTE"),
        "s3_key": data.get("s3_key", ""),
        "ocr_json": json.dumps(data.get("ocr")) if data.get("ocr") else "",
        "creado_en": datetime.utcnow().isoformat(),
    }
    _doc_table().put_item(Item=item)
    return _doc_to_api(_to_json(item))


def _doc_to_api(item: dict) -> dict:
    estado = item["estado"]
    s3_key = item.get("s3_key", "")
    return {
        "id": int(item.get("num_id") or abs(hash(item["id"])) % 999_999),
        "nombre": item["nombre"],
        "vehiculo": item["vehiculo"],
        "vin": item.get("vin", ""),
        "tipo": item["tipo"],
        "fecha": item["fecha"],
        "estado": estado,
        "pasoActual": _paso_index(estado),
        "tieneArchivo": bool(s3_key),
        "_dynamo_id": item["id"],
    }


PASOS_FLUJO = ["Subida", "OCR/Scan", "Validación", "Aprobación", "Archivado S3"]


def _paso_index(estado: str) -> int:
    return {"PENDIENTE": 0, "EN_REVISION": 2, "VERIFICADO": 4}.get(estado, 0)


def _siguiente_accion(estado: str) -> str | None:
    if estado == "PENDIENTE":
        return "Ejecutar OCR y pasar a validación"
    if estado == "EN_REVISION":
        return "Aprobar documento"
    return None


def _find_doc(num_id: int) -> dict | None:
    for item in _doc_table().scan().get("Items", []):
        if int(item.get("num_id", 0)) == num_id:
            return item
    return None


def _doc_to_detalle(item: dict) -> dict:
    ocr = json.loads(item.get("ocr_json")) if item.get("ocr_json") else None
    s3_key = item.get("s3_key", "")
    estado = item["estado"]
    return {
        **_doc_to_api(_to_json(item)),
        "ocr": ocr,
        "tieneArchivo": bool(s3_key),
        "pasos": PASOS_FLUJO,
        "siguienteAccion": _siguiente_accion(estado),
    }


def get_documento(num_id: int) -> dict | None:
    item = _find_doc(num_id)
    if not item:
        return None
    return _doc_to_detalle(_to_json(item))


def get_documento_raw(num_id: int) -> dict | None:
    item = _find_doc(num_id)
    if not item:
        return None
    return _to_json(item)


def list_documentos_por_vin(vin: str) -> list[dict]:
    vin_upper = vin.upper().strip()
    if len(vin_upper) < 11:
        return []
    result = []
    for item in _doc_table().scan().get("Items", []):
        doc_vin = (item.get("vin") or "").upper().strip()
        if not doc_vin and item.get("ocr_json"):
            ocr = json.loads(item["ocr_json"])
            doc_vin = (ocr.get("vin") or "").upper().strip()
        if doc_vin == vin_upper:
            result.append(_doc_to_api(_to_json(item)))
    result.sort(key=lambda x: x.get("fecha", ""), reverse=True)
    return result


def get_inspeccion_por_vin(vin: str) -> dict | None:
    vin_upper = vin.upper().strip()
    if len(vin_upper) < 11:
        return None
    items = _ins_table().scan().get("Items", [])
    matches = [i for i in items if (i.get("vin") or "").upper().strip() == vin_upper]
    if not matches:
        return None
    latest = sorted(matches, key=lambda x: x.get("fecha", ""), reverse=True)[0]
    return _ins_to_reciente(_to_json(latest))


def find_ocr_by_vin(vin: str) -> dict | None:
    """Busca OCR en documentos ya registrados con el mismo VIN."""
    vin_upper = vin.upper().strip()
    if len(vin_upper) < 11:
        return None
    for item in _doc_table().scan().get("Items", []):
        ocr_json = item.get("ocr_json")
        if not ocr_json:
            continue
        ocr = json.loads(ocr_json)
        doc_vin = (ocr.get("vin") or "").upper().strip()
        if doc_vin == vin_upper:
            return ocr
    return None


def avanzar_documento(num_id: int) -> dict | None:
    item = _find_doc(num_id)
    if not item:
        return None
    estado = item.get("estado", "PENDIENTE")
    if estado == "PENDIENTE":
        item["estado"] = "EN_REVISION"
        if not item.get("ocr_json"):
            item["ocr_json"] = json.dumps({
                "propietario": "Pendiente verificación manual",
                "vin": "No detectado",
                "estado": "Documento escaneado",
                "fechaEmision": date.today().isoformat(),
                "tipoTitulo": "En revisión OCR",
                "confianza": 72.0,
            })
    elif estado == "EN_REVISION":
        item["estado"] = "VERIFICADO"
    _doc_table().put_item(Item=item)
    return _doc_to_detalle(_to_json(item))


def update_documento(num_id: int, fields: dict) -> dict | None:
    item = _find_doc(num_id)
    if not item:
        return None
    allowed = ("nombre", "vehiculo", "tipo", "fecha", "estado")
    for key in allowed:
        if key in fields and fields[key] is not None:
            item[key] = fields[key]
    _doc_table().put_item(Item=item)
    return _doc_to_detalle(_to_json(item))


def attach_archivo_documento(
    num_id: int,
    s3_key: str,
    ocr: dict | None = None,
    nombre: str | None = None,
) -> dict | None:
    item = _find_doc(num_id)
    if not item:
        return None
    item["s3_key"] = s3_key
    if nombre:
        item["nombre"] = nombre
    if ocr:
        item["ocr_json"] = json.dumps(ocr)
        if item.get("estado") == "PENDIENTE" and float(ocr.get("confianza") or 0) >= 85:
            item["estado"] = "EN_REVISION"
    _doc_table().put_item(Item=item)
    return _doc_to_detalle(_to_json(item))


def _ins_to_activa(item: dict) -> dict:
    danos = json.loads(item.get("danos_json") or "[]")
    ocr = json.loads(item.get("ocr_json")) if item.get("ocr_json") else None
    s3_key = item.get("s3_key", "")
    fotos_raw = json.loads(item.get("fotos_json") or "{}")
    fotos360 = {
        k: presigned_url(v) if v else None
        for k, v in fotos_raw.items()
    }
    foto_principal = fotos360.get("delante") or (presigned_url(s3_key) if s3_key else None)
    validacion = json.loads(item.get("validacion_calidad_json") or "{}")
    return {
        "vehiculo": item["vehiculo"],
        "vin": item["vin"],
        "fecha": item["fecha"],
        "modeloDetectado": item.get("modelo_detectado", ""),
        "confianzaModelo": float(item.get("confianza_modelo", 0)),
        "danosDetectados": int(item.get("danos_detectados", 0)),
        "severidad": item.get("severidad", "Sin daños"),
        "costoReparacion": int(item.get("costo_reparacion", 0)),
        "danos": danos,
        "ocr": ocr,
        "resultado": item.get("resultado", ""),
        "fotoUrl": foto_principal,
        "fotos360": fotos360 if fotos360 else None,
        "modoInspeccion": item.get("modo_inspeccion", "simple"),
        "validacionCalidad": validacion if validacion else None,
    }


def _ins_to_reciente(item: dict) -> dict:
    return {
        "vehiculo": item["vehiculo"],
        "resultado": item.get("resultado", ""),
        "fecha": item["fecha"],
    }


def get_inspeccion_activa() -> dict | None:
    table = _ins_table()
    try:
        resp = table.query(
            IndexName="activa-fecha-index",
            KeyConditionExpression=Key("activa").eq("true"),
            ScanIndexForward=False,
            Limit=1,
        )
    except ClientError:
        items = [i for i in table.scan().get("Items", []) if i.get("activa") == "true"]
        if not items:
            return None
        items.sort(key=lambda x: x.get("fecha", ""), reverse=True)
        return _ins_to_activa(_to_json(items[0]))

    items = resp.get("Items", [])
    if not items:
        return None
    return _ins_to_activa(_to_json(items[0]))


def list_inspecciones_recientes(limit: int = 10) -> list[dict]:
    items = [i for i in _ins_table().scan().get("Items", []) if i.get("activa") != "true"]
    items.sort(key=lambda x: x.get("fecha", ""), reverse=True)
    return [_ins_to_reciente(_to_json(i)) for i in items[:limit]]


def deactivate_inspecciones() -> None:
    for item in _ins_table().scan().get("Items", []):
        if item.get("activa") == "true":
            item["activa"] = "false"
            _ins_table().put_item(Item=item)


def save_inspeccion(data: dict) -> dict:
    if data.get("activa"):
        deactivate_inspecciones()

    ins_id = data.get("id") or str(uuid.uuid4())
    item = {
        "id": ins_id,
        "vehiculo": data["vehiculo"],
        "vin": data["vin"],
        "fecha": data.get("fecha", date.today().isoformat()),
        "modelo_detectado": data.get("modelo_detectado", ""),
        "confianza_modelo": Decimal(str(data.get("confianza_modelo", 0))),
        "danos_detectados": data.get("danos_detectados", 0),
        "severidad": data.get("severidad", "Sin daños"),
        "costo_reparacion": data.get("costo_reparacion", 0),
        "danos_json": json.dumps(data.get("danos", [])),
        "ocr_json": json.dumps(data.get("ocr")) if data.get("ocr") else "",
        "resultado": data.get("resultado", ""),
        "activa": "true" if data.get("activa") else "false",
        "s3_key": data.get("s3_key", ""),
        "fotos_json": json.dumps(data.get("fotos", {})),
        "modo_inspeccion": data.get("modo_inspeccion", "simple"),
        "validacion_calidad_json": json.dumps(data.get("validacion_calidad") or {}),
        "creado_en": datetime.utcnow().isoformat(),
    }
    _ins_table().put_item(Item=item)
    return _ins_to_activa(_to_json(item))
