# MS-3 — DynamoDB + S3 (MinIO)

**Metadatos:** DynamoDB Local `:8000`  
**Archivos:** MinIO bucket `importadora-ms3-docs` `:9000`

Las tablas se crean automáticamente al arrancar MS-3 (`dynamo_repository.ensure_tables()`).

---

## Tabla: `ms3-documentos`

| Atributo | Tipo | Clave | Descripción |
|----------|------|-------|-------------|
| `id` | String (UUID) | **PK** | Identificador interno |
| `num_id` | Number | — | ID numérico para el frontend |
| `nombre` | String | — | Nombre del archivo |
| `vehiculo` | String | — | Vehículo asociado |
| `tipo` | String | — | Titulo, Factura, BL, Poliza |
| `fecha` | String (ISO) | — | Fecha de registro |
| `estado` | String | — | VERIFICADO, PENDIENTE, EN_REVISION |
| `s3_key` | String | — | Ruta en S3/MinIO |
| `ocr_json` | String (JSON) | — | Resultado OCR |
| `creado_en` | String (ISO) | — | Timestamp creación |

### Ejemplo de item

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "num_id": 42,
  "nombre": "TIT-2025-0034.pdf",
  "vehiculo": "Toyota RAV4 2024",
  "tipo": "Titulo",
  "fecha": "2025-01-10",
  "estado": "VERIFICADO",
  "s3_key": "documentos/f8e2a1b3c4d5.pdf",
  "ocr_json": "{\"vin\":\"2T3P1RFV5RC123456\",\"confianza\":94.5}",
  "creado_en": "2026-06-05T12:00:00"
}
```

---

## Tabla: `ms3-inspecciones`

| Atributo | Tipo | Clave | Descripción |
|----------|------|-------|-------------|
| `id` | String (UUID) | **PK** | Identificador interno |
| `vehiculo` | String | — | Nombre del vehículo |
| `vin` | String | — | VIN analizado |
| `fecha` | String (ISO) | GSI SK | Fecha inspección |
| `modelo_detectado` | String | — | Modelo IA |
| `confianza_modelo` | Number | — | % confianza |
| `danos_detectados` | Number | — | Cantidad de daños |
| `severidad` | String | — | Leve, Moderada, Severa |
| `costo_reparacion` | Number | — | USD estimado |
| `danos_json` | String (JSON) | — | Lista de daños |
| `ocr_json` | String (JSON) | — | OCR opcional |
| `resultado` | String | — | Resumen texto |
| `activa` | String | **GSI PK** | `"true"` / `"false"` |
| `s3_key` | String | — | Foto en S3/MinIO |
| `creado_en` | String (ISO) | — | Timestamp creación |

### GSI: `activa-fecha-index`

| | |
|--|--|
| Partition key | `activa` |
| Sort key | `fecha` |
| Uso | Obtener inspección activa (`activa = "true"`) |

---

## S3 / MinIO — bucket `importadora-ms3-docs`

```
importadora-ms3-docs/
├── documentos/
│   └── {uuid}.pdf
└── inspecciones/
    └── {uuid}.jpg
```

| Variable | Valor local |
|----------|-------------|
| `S3_ENDPOINT` | http://localhost:9000 |
| `S3_BUCKET` | importadora-ms3-docs |
| Consola MinIO | http://localhost:9001 |

---

## Enlace con otros MS (solo por ID, sin FK)

| Campo MS-3 | Referencia |
|------------|------------|
| `vehiculo` (texto) | Descriptivo; opcional `GET MS-1 /vehiculos/{id}` |
| Archivos | Solo en S3; metadatos en DynamoDB |
