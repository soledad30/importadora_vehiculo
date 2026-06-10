# MS-2 y MS-3 — Arquitectura

## MS-2 — Django (Machine Learning)

| Capa | Tecnología |
|------|------------|
| API | Django REST Framework `:8081` |
| ML | scikit-learn (KMeans, IsolationForest) |
| BD | PostgreSQL `importadora_ms2` (Docker) |
| Origen datos | MS-1 vía HTTP + JWT |

**Funciones:** predicción demanda, segmentación clientes, anomalías, análisis histórico, logística (embarques), cotizador, blockchain mock.

## MS-3 — Python (Deep Learning)

| Capa | Tecnología |
|------|------------|
| API orquestador | FastAPI `:8082` |
| Worker DL | FastAPI + Pillow/NumPy `:5000` |
| Metadatos | DynamoDB Local `:8000` |
| Archivos | MinIO S3 `:9000` |

**Funciones:** OCR documentos, detección daños, reconocimiento modelo, almacenamiento S3.

## Docker (infra/docker-compose.yml)

```powershell
cd infra
docker compose up -d
.\scripts\create-all-databases.ps1
```

| Servicio | Contenedor | Puerto |
|----------|------------|--------|
| PostgreSQL MS-1+MS-2 | importadora-postgres | 5432 |
| DynamoDB MS-3 | importadora-dynamodb | 8000 |
| MinIO MS-3 | importadora-minio | 9000, 9001 |

## Flujo integrado (9 pasos)

1. Cliente consulta → Angular
2. MS-1 registra pedido
3. N8N notifica (pendiente)
4. **MS-3** analiza fotos → DynamoDB + S3
5. Blockchain ingreso → MS-2 mock
6. **MS-2** predice demanda
7. Notificación cliente
8. Documentos en S3 (MS-3)
9. Blockchain entrega
