# Bases de datos por microservicio

Cada MS tiene **su propia base/almacenamiento**. No comparten tablas.

| Microservicio | Almacenamiento | Nombre / recurso | Puerto |
|---------------|----------------|------------------|--------|
| **MS-1** | PostgreSQL 17 | `importadora_vehiculos` | 5432 |
| **MS-2** | PostgreSQL 17 | `importadora_ms2` | 5432 (mismo servidor) |
| **MS-3** metadatos | DynamoDB Local | `ms3-documentos`, `ms3-inspecciones` | 8000 |
| **MS-3** archivos | MinIO (S3) | bucket `importadora-ms3-docs` | 9000 / consola 9001 |

## Inicio infraestructura

```powershell
cd infra
docker compose up -d
.\scripts\setup-databases.ps1   # solo si Postgres ya existía sin importadora_ms2
```

## Variables por servicio

- MS-1: `application.yml` → `importadora_vehiculos`
- MS-2: `ms-2-ml/.env.example` → `importadora_ms2`
- MS-3: `ms-3-dl/.env.example` → DynamoDB + MinIO

## Producción (AWS)

- MS-1 / MS-2: RDS PostgreSQL (dos bases o dos instancias)
- MS-3: DynamoDB + S3 reales (mismas variables, sin `DYNAMODB_ENDPOINT` ni `S3_ENDPOINT` local)
