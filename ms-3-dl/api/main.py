"""API REST MS-3 — documentos, OCR e inspección IA (DynamoDB + S3)."""

import os
from typing import Optional

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

import dynamo_repository as repo
from storage import ensure_bucket, presigned_url, upload_bytes, download_bytes, _content_type

load_dotenv()

app = FastAPI(title="MS-3 DL API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv(
    "JWT_SECRET", "importadora-vehiculos-jwt-secret-key-2026-min-32-chars"
)
DL_WORKER_URL = os.getenv("DL_WORKER_URL", "http://localhost:5000")
MS1_API_URL = os.getenv("MS1_API_URL", "http://localhost:8080/api/v1")

CATEGORIAS = [
    ("Titulos de Propiedad", "Titulo", "file-text-outline"),
    ("Facturas Comerciales", "Factura", "pricetags-outline"),
    ("Bill of Lading (BL)", "BL", "globe-outline"),
    ("Polizas de Importacion", "Poliza", "shield-outline"),
    ("Permisos Fitosanitarios", "Permiso", "checkmark-circle-outline"),
    ("Cartas de Porte", "Carta", "car-outline"),
]


@app.on_event("startup")
def startup():
    repo.ensure_tables()
    ensure_bucket()
    repo.seed_if_empty()


def verify_jwt(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization[7:]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256", "HS384"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Token inválido") from exc


@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "ms-3-dl-api",
        "version": "0.3.0",
        "storage": "dynamodb+s3",
    }


@app.get("/api/documentos/resumen")
def resumen_documentos(_user=Depends(verify_jwt)):
    return repo.resumen_documentos()


@app.get("/api/reportes/documentos")
def reporte_documentos(_user=Depends(verify_jwt)):
    return repo.resumen_reporte_documentos(CATEGORIAS)


@app.get("/api/reportes/inspeccion")
def reporte_inspeccion(_user=Depends(verify_jwt)):
    return repo.resumen_reporte_inspeccion()


@app.get("/api/documentos/categorias")
def categorias_documentos(_user=Depends(verify_jwt)):
    return repo.categorias_documentos(CATEGORIAS)


@app.get("/api/documentos")
def listar_documentos(_user=Depends(verify_jwt)):
    return repo.list_documentos()


@app.get("/api/documentos/por-vin/{vin}")
def documentos_por_vin(vin: str, _user=Depends(verify_jwt)):
    return repo.list_documentos_por_vin(vin)


@app.get("/api/documentos/{doc_id}")
def obtener_documento(doc_id: int, _user=Depends(verify_jwt)):
    doc = repo.get_documento(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return doc


@app.post("/api/documentos/{doc_id}/avanzar")
def avanzar_documento(doc_id: int, _user=Depends(verify_jwt)):
    doc = repo.avanzar_documento(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return doc


@app.get("/api/documentos/{doc_id}/archivo")
def ver_archivo_documento(doc_id: int, _user=Depends(verify_jwt)):
    item = repo.get_documento_raw(doc_id)
    if not item:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    s3_key = item.get("s3_key", "")
    if not s3_key:
        raise HTTPException(status_code=404, detail="Este documento no tiene archivo en S3")
    content = download_bytes(s3_key)
    if content is None:
        raise HTTPException(status_code=404, detail="No se pudo leer el archivo")
    nombre = item.get("nombre", "documento")
    media_type = _content_type(nombre)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{nombre}"'},
    )


class ActualizarDocumentoBody(BaseModel):
    nombre: str | None = None
    vehiculo: str | None = None
    tipo: str | None = None
    fecha: str | None = None


@app.patch("/api/documentos/{doc_id}")
def actualizar_documento(
    doc_id: int,
    body: ActualizarDocumentoBody,
    _user=Depends(verify_jwt),
):
    payload = body.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    doc = repo.update_documento(doc_id, payload)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return doc


@app.post("/api/documentos/{doc_id}/archivo")
async def adjuntar_archivo_documento(
    doc_id: int,
    file: UploadFile = File(...),
    vin: str | None = Form(default=None),
    _user=Depends(verify_jwt),
):
    item = repo.get_documento_raw(doc_id)
    if not item:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="El archivo está vacío")

    s3_key = upload_bytes(content, file.filename or "documento", prefix="documentos")

    async with httpx.AsyncClient(timeout=30.0) as client:
        files = {"file": (file.filename, content, file.content_type or "application/octet-stream")}
        data = {"vin": vin} if vin else None
        resp = await client.post(f"{DL_WORKER_URL}/ocr/titulo", files=files, data=data)
        resp.raise_for_status()
        ocr = resp.json()

    doc = repo.attach_archivo_documento(
        doc_id,
        s3_key,
        ocr=ocr,
        nombre=file.filename or item.get("nombre"),
    )
    return doc


@app.get("/api/inspeccion/por-vin/{vin}")
def inspeccion_por_vin(vin: str, _user=Depends(verify_jwt)):
    ins = repo.get_inspeccion_por_vin(vin)
    if not ins:
        raise HTTPException(status_code=404, detail="Sin inspección para este VIN")
    return ins


@app.post("/api/documentos/upload")
async def subir_documento(
    file: UploadFile = File(...),
    vehiculo: str = Form(...),
    vin: str = Form(""),
    tipo: str = Form("Titulo"),
    _user=Depends(verify_jwt),
):
    content = await file.read()
    s3_key = upload_bytes(content, file.filename or "documento", prefix="documentos")

    async with httpx.AsyncClient(timeout=30.0) as client:
        files = {"file": (file.filename, content, file.content_type or "application/octet-stream")}
        resp = await client.post(f"{DL_WORKER_URL}/ocr/titulo", files=files)
        resp.raise_for_status()
        ocr = resp.json()

    estado = "VERIFICADO" if ocr.get("confianza", 0) >= 85 else "EN_REVISION"
    doc = repo.save_documento({
        "nombre": file.filename or "documento",
        "vehiculo": vehiculo,
        "vin": vin or ocr.get("vin", ""),
        "tipo": tipo,
        "estado": estado,
        "s3_key": s3_key,
        "ocr": ocr,
    })
    return {**doc, "ocr": ocr, "s3Key": s3_key}


@app.get("/api/inspeccion/activa")
def inspeccion_activa(_user=Depends(verify_jwt)):
    ins = repo.get_inspeccion_activa()
    if not ins:
        raise HTTPException(status_code=404, detail="No hay inspección activa")
    return ins


@app.get("/api/inspeccion/recientes")
def inspecciones_recientes(_user=Depends(verify_jwt)):
    return repo.list_inspecciones_recientes()


@app.get("/api/inspeccion/recientes")
def inspecciones_recientes(_user=Depends(verify_jwt)):
    return repo.list_inspecciones_recientes()


@app.post("/api/inspeccion/validar-vistas")
async def validar_vistas_inspeccion(
    foto_delante: UploadFile = File(...),
    foto_detras: UploadFile = File(...),
    foto_izquierda: UploadFile = File(...),
    foto_derecha: UploadFile = File(...),
    _user=Depends(verify_jwt),
):
    """Pre-validación de las 4 fotos antes del análisis completo."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {
            "foto_delante": (
                foto_delante.filename,
                await foto_delante.read(),
                foto_delante.content_type or "image/jpeg",
            ),
            "foto_detras": (
                foto_detras.filename,
                await foto_detras.read(),
                foto_detras.content_type or "image/jpeg",
            ),
            "foto_izquierda": (
                foto_izquierda.filename,
                await foto_izquierda.read(),
                foto_izquierda.content_type or "image/jpeg",
            ),
            "foto_derecha": (
                foto_derecha.filename,
                await foto_derecha.read(),
                foto_derecha.content_type or "image/jpeg",
            ),
        }
        resp = await client.post(f"{DL_WORKER_URL}/inspeccion/validar-vistas", files=files)
        resp.raise_for_status()
        return resp.json()


def _raise_validacion_inspeccion(danos: dict) -> None:
    raise HTTPException(
        status_code=422,
        detail={
            "mensaje": danos.get("mensaje", "Las fotos no pasaron la validación"),
            "problemas": danos.get("problemas", []),
            "consistenciaMinima": danos.get("consistenciaMinima"),
        },
    )


@app.post("/api/inspeccion/analizar")
async def analizar_inspeccion(
    vin: str = Form(...),
    vehiculo: str = Form(""),
    documento: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    foto_delante: Optional[UploadFile] = File(None),
    foto_detras: Optional[UploadFile] = File(None),
    foto_izquierda: Optional[UploadFile] = File(None),
    foto_derecha: Optional[UploadFile] = File(None),
    _user=Depends(verify_jwt),
):
    vistas = {
        "delante": foto_delante,
        "detras": foto_detras,
        "izquierda": foto_izquierda,
        "derecha": foto_derecha,
    }
    modo_360 = all(v and v.filename for v in vistas.values())

    if not modo_360 and not (file and file.filename):
        raise HTTPException(
            status_code=400,
            detail="Suba 4 fotos (delante, detrás, izquierda, derecha) o una foto única (legacy)",
        )

    fotos_s3: dict[str, str] = {}
    async with httpx.AsyncClient(timeout=90.0) as client:
        if modo_360:
            contents: dict[str, bytes] = {}
            for key, upload in vistas.items():
                data = await upload.read()
                contents[key] = data
                fotos_s3[key] = upload_bytes(
                    data, upload.filename or f"{key}.jpg", prefix="inspecciones"
                )

            danos_files = {
                "foto_delante": (
                    vistas["delante"].filename,
                    contents["delante"],
                    vistas["delante"].content_type or "image/jpeg",
                ),
                "foto_detras": (
                    vistas["detras"].filename,
                    contents["detras"],
                    vistas["detras"].content_type or "image/jpeg",
                ),
                "foto_izquierda": (
                    vistas["izquierda"].filename,
                    contents["izquierda"],
                    vistas["izquierda"].content_type or "image/jpeg",
                ),
                "foto_derecha": (
                    vistas["derecha"].filename,
                    contents["derecha"],
                    vistas["derecha"].content_type or "image/jpeg",
                ),
            }
            danos_resp = await client.post(
                f"{DL_WORKER_URL}/inspeccion/danos-360", files=danos_files
            )
            modelo_files = {
                "file": (
                    vistas["delante"].filename,
                    contents["delante"],
                    vistas["delante"].content_type or "image/jpeg",
                )
            }
            modelo_resp = await client.post(
                f"{DL_WORKER_URL}/inspeccion/modelo",
                files=modelo_files,
                data={"vin": vin},
            )
            s3_key = fotos_s3["delante"]
            modo_inspeccion = "360"
        else:
            content = await file.read()
            s3_key = upload_bytes(content, file.filename or "foto.jpg", prefix="inspecciones")
            files = {"file": (file.filename, content, file.content_type or "image/jpeg")}
            data = {"vin": vin}
            danos_resp = await client.post(f"{DL_WORKER_URL}/inspeccion/danos", files=files)
            modelo_resp = await client.post(
                f"{DL_WORKER_URL}/inspeccion/modelo", files=files, data=data
            )
            fotos_s3 = {}
            modo_inspeccion = "simple"

        danos_resp.raise_for_status()
        modelo_resp.raise_for_status()
        danos = danos_resp.json()
        if danos.get("error"):
            _raise_validacion_inspeccion(danos)
        modelo = modelo_resp.json()

    ocr = None
    if documento and documento.filename:
        doc_content = await documento.read()
        async with httpx.AsyncClient(timeout=30.0) as client:
            ocr_files = {
                "file": (
                    documento.filename,
                    doc_content,
                    documento.content_type or "application/octet-stream",
                )
            }
            ocr_resp = await client.post(
                f"{DL_WORKER_URL}/ocr/titulo",
                files=ocr_files,
                data={"vin": vin},
            )
            ocr_resp.raise_for_status()
            ocr = ocr_resp.json()
    if not ocr:
        ocr = repo.find_ocr_by_vin(vin)

    nombre_vehiculo = vehiculo or modelo.get("modeloDetectado", f"VIN {vin}")
    resultado = (
        "Sin daños" if danos.get("danosDetectados", 0) == 0
        else f"{danos['danosDetectados']} daño(s) detectado(s)"
    )

    return repo.save_inspeccion({
        "vehiculo": nombre_vehiculo,
        "vin": vin.upper(),
        "modelo_detectado": modelo.get("modeloDetectado", ""),
        "confianza_modelo": modelo.get("confianzaModelo", 0),
        "danos_detectados": danos.get("danosDetectados", 0),
        "severidad": danos.get("severidad", "Sin daños"),
        "costo_reparacion": danos.get("costoReparacion", 0),
        "danos": danos.get("danos", []),
        "ocr": ocr,
        "resultado": resultado,
        "activa": True,
        "s3_key": s3_key,
        "fotos": fotos_s3,
        "modo_inspeccion": modo_inspeccion,
        "validacion_calidad": danos.get("validacionCalidad"),
    })


@app.get("/api/archivos/url")
def url_archivo(key: str, _user=Depends(verify_jwt)):
    url = presigned_url(key)
    if not url:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return {"url": url, "key": key}


@app.get("/api/vehiculos/{vehiculo_id}")
async def vehiculo_desde_ms1(
    vehiculo_id: int,
    authorization: str = Header(...),
    _user=Depends(verify_jwt),
):
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{MS1_API_URL}/vehiculos/{vehiculo_id}",
            headers={"Authorization": authorization},
        )
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado en MS-1")
        resp.raise_for_status()
        return resp.json()
