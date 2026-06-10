# MS-2 — Machine Learning / Logística

Stack: **Django 5** + **DRF** + **scikit-learn** en puerto **8081**.

Activado por **MS-1** (JWT compartido). Lee pedidos/vehículos/clientes de MS-1 para los modelos ML.

## Base de datos (dedicada MS-2)

**PostgreSQL** `importadora_ms2` — mismo servidor Docker que MS-1, **base separada** (embarques, cotizaciones).

Copia `.env.example` → `.env` si necesitas cambiar credenciales.

## Requisitos

- Python 3.11+
- Docker: `cd infra; .\scripts\create-all-databases.ps1`
- MS-1 en `:8080` (JWT compartido)

## Inicio

```powershell
cd ms-2-ml
.\scripts\start.ps1
```

- Health: http://localhost:8081/health/

## API ML (invocadas por MS-1 / Angular)

| Endpoint | Función |
|----------|---------|
| `GET /api/ml/prediccion-demanda?meses=3` | Proyección de demanda por marca |
| `GET /api/ml/segmentacion-clientes` | Segmentación K-Means |
| `GET /api/ml/anomalias` | Detección Isolation Forest |
| `GET /api/ml/analisis-historico` | Serie temporal pedidos/ventas |

## API Logística

- `/api/embarques`, `/api/importaciones/*`, `/api/cotizador/*`, `/api/proveedores`, `/api/blockchain`
