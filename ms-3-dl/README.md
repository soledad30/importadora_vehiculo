# MS-3 — Deep Learning (OCR + Inspección IA)

Stack: **FastAPI** orquestador (`:8082`) + **Python DL Worker** (`:5000`).

> En el diagrama aparece Nest.js; aquí el orquestador es **FastAPI (Python)** con el mismo rol: recibe fotos/documentos, delega al worker DL y persiste en DynamoDB/S3. El móvil (React Native) puede enviar fotos directo a `:8082`.

## Arquitectura

```
Angular / Móvil  →  FastAPI API (:8082)  →  Python DL Worker (:5000)
                           ↓                        ↓
                    DynamoDB Local              análisis imagen
                    MinIO (S3)
```

## Almacenamiento (dedicado MS-3)

| Tipo | Tecnología | Recurso |
|------|------------|---------|
| Metadatos | **DynamoDB Local** | `ms3-documentos`, `ms3-inspecciones` |
| Archivos | **MinIO** (compatible S3) | bucket `importadora-ms3-docs` |

Copia `.env.example` → `.env` si necesitas personalizar endpoints.

## Requisitos

- Python 3.11+
- Docker: DynamoDB Local + MinIO (`infra/docker-compose up -d`)
- MS-1 en `:8080` (JWT compartido)

## Inicio

```powershell
cd ms-3-dl
.\scripts\start.ps1
```

- API: http://localhost:8082/health
- Worker: http://localhost:5000/health

## Modelo YOLO — local o Roboflow cloud

### Opción C — Roboflow cloud (plan gratuito, sin descargar pesos)

Tu modelo: `soles-workspace` / `vehicle-damage-detection-nuiry` v1

1. Obtén API Key: [Roboflow Settings → API](https://app.roboflow.com/settings/api)
2. Configura:

```powershell
cd ms-3-dl
.\scripts\configure_roboflow_cloud.ps1 -ApiKey "TU_API_KEY"
.\scripts\install-dl-deps.ps1
.\scripts\stop.ps1
.\scripts\start.ps1
```

3. Verifica http://localhost:5000/health → `"backend": "roboflow_cloud"`

Requiere **internet** durante cada inspección.

### Opción local — archivo .pt (requiere plan Roboflow pago para Download Weights)

1. En Roboflow → **Modelos** → tu modelo → **Exportar** → formato **YOLOv8**
2. Descarga el ZIP y localiza `best.pt` (a veces en `weights/best.pt`)
3. Importa al worker:

```powershell
cd ms-3-dl
.\scripts\import_roboflow_model.ps1 -SourcePath "C:\Downloads\best.pt"
.\scripts\install-dl-deps.ps1
.\scripts\stop.ps1
.\scripts\start.ps1
```

4. Verifica: http://localhost:5000/health → `"dl": { "useDlModel": true, "modelPath": "..." }`

Variables en `.env`:

| Variable | Ejemplo |
|----------|---------|
| `USE_DL_MODEL` | `true` |
| `DL_DAMAGE_MODEL_PATH` | ruta a `models/damage_yolo.pt` |
| `DL_CONF_THRESHOLD` | `0.35` (confianza mínima) |
