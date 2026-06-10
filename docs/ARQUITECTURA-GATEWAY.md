# API Gateway — Arquitectura

## Problema que resuelve

Sin gateway, el navegador habla con **varios puertos** (`4200`, `8080`, `8081`, `8082`). Si Angular cambia de puerto o CORS no coincide, aparecen errores de login y de MS-2/MS-3.

## Solución: un solo punto de entrada

```
┌─────────────────────────────────────────────────────────────┐
│  Navegador / App móvil                                       │
│  http://localhost:8888  (un solo origen)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │  Nginx API Gateway    │
                │  Docker :8888 → :80   │
                └───┬───────┬───────┬───┘
                    │       │       │
         /api/*     │ /ms2/*│ /ms3/*│  /
                    ▼       ▼       ▼   ▼
                 MS-1    MS-2    MS-3  Angular
                :8080   :8081   :8082  :4200
              (host)   (host)  (host) (host)
```

**Un gateway para todos los servicios.** No se usa un gateway por microservicio.

## Rutas

| URL pública | Servicio interno | Ejemplo |
|-------------|------------------|---------|
| `/api/v1/*` | MS-1 `:8080` | `POST /api/v1/auth/login` |
| `/ms2/api/*` | MS-2 `:8081` | `GET /ms2/api/embarques` |
| `/ms3/api/*` | MS-3 `:8082` | `POST /ms3/api/inspeccion/analizar` |
| `/` | Angular `:4200` | Portal web + HMR |
| `/gateway/health` | Nginx | Estado del gateway |

## Inicio

```powershell
# 1. Infra + gateway
cd infra
docker compose up -d

# 2. MS-1, MS-2, MS-3 y Angular (terminales separadas)
cd ms-1-principal; mvn spring-boot:run
cd infra; .\scripts\start-ms2-ms3.ps1
cd frontend-angular; npm run start:kill

# 3. Abrir portal
# http://localhost:8888
```

O usar el script guía:

```powershell
cd infra
.\scripts\start-stack.ps1
```

## Desarrollo: dos modos

| Modo | URL | Cuándo usar |
|------|-----|-------------|
| **Gateway (recomendado)** | `http://localhost:8888` | Demo, integración MS-2/MS-3, sin problemas de CORS |
| **Angular directo** | `http://localhost:4200` | Solo frontend; usa `proxy.conf.json` |

## Producción

En producción el mismo patrón aplica con HTTPS:

- Nginx / Traefik / AWS API Gateway + ALB
- MS-1, MS-2 y MS-3 en red privada (sin puertos públicos)
- Angular servido como estáticos (`dist/`) detrás del mismo dominio

## Archivos

| Archivo | Rol |
|---------|-----|
| `infra/gateway/nginx.conf` | Reglas de enrutamiento |
| `infra/docker-compose.yml` | Servicio `gateway` en puerto 8888 |
| `infra/scripts/start-gateway.ps1` | Levantar solo el gateway |
| `frontend-angular/proxy.conf.json` | Proxy local (modo :4200 sin gateway) |
