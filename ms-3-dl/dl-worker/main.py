"""Worker Deep Learning — OCR e inspección de vehículos (MS-3)."""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from analysis import analyze_damage, analyze_damage_360, analyze_model, analyze_ocr
from dl_models import model_status
from vehicle_validation import validate_views_consistency

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="MS-3 DL Worker", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "ms-3-dl-worker",
        "version": "0.3.0",
        "dl": model_status(),
    }


@app.post("/ocr/titulo")
async def ocr_titulo(
    file: UploadFile = File(...),
    vin: str | None = Form(default=None),
):
    content = await file.read()
    return analyze_ocr(content, file.filename, vin)


@app.post("/inspeccion/danos")
async def inspeccion_danos(file: UploadFile = File(...)):
    content = await file.read()
    return analyze_damage(content)


@app.post("/inspeccion/validar-vistas")
async def inspeccion_validar_vistas(
    foto_delante: UploadFile = File(...),
    foto_detras: UploadFile = File(...),
    foto_izquierda: UploadFile = File(...),
    foto_derecha: UploadFile = File(...),
):
    views = {
        "delante": await foto_delante.read(),
        "detras": await foto_detras.read(),
        "izquierda": await foto_izquierda.read(),
        "derecha": await foto_derecha.read(),
    }
    return validate_views_consistency(views)


@app.post("/inspeccion/danos-360")
async def inspeccion_danos_360(
    foto_delante: UploadFile = File(...),
    foto_detras: UploadFile = File(...),
    foto_izquierda: UploadFile = File(...),
    foto_derecha: UploadFile = File(...),
):
    views = {
        "delante": await foto_delante.read(),
        "detras": await foto_detras.read(),
        "izquierda": await foto_izquierda.read(),
        "derecha": await foto_derecha.read(),
    }
    return analyze_damage_360(views)


@app.post("/inspeccion/modelo")
async def inspeccion_modelo(
    file: UploadFile = File(...),
    vin: str | None = Form(default=None),
):
    content = await file.read()
    return analyze_model(content, vin)
