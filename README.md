# Importadora de Vehículos 2026

Sistema de microservicios para gestión de ventas, importaciones y logística de vehículos.

## Stack (fase actual)

| Componente | Tecnología | Estado |
|------------|------------|--------|
| MS-1 Principal | Spring Boot 3.4 + Java **17** + JWT | En desarrollo |
| MS-1 BD | PostgreSQL `importadora_vehiculos` | Docker |
| MS-2 ML | Django (`:8081`) | En desarrollo |
| MS-2 BD | PostgreSQL `importadora_ms2` | Docker (mismo Postgres) |
| MS-3 DL | FastAPI + Python DL (`:8082` / `:5000`) | En desarrollo |
| MS-3 BD | DynamoDB Local + MinIO (S3) | Docker |
| Web | Angular 19 | En desarrollo |
| API Gateway | Nginx (`:8888`) | Docker |
| Móvil | Expo / React Native | En desarrollo |

## Requisitos

- Java 17 (recomendado para MS-1; Java 25 no es necesario en esta fase)
- Maven 3.9+
- Docker Desktop (para PostgreSQL en contenedor)

## Inicio rápido

### 1. Infraestructura (una BD/almacén por microservicio)

```powershell
cd infra
.\scripts\create-all-databases.ps1
```

| Servicio | Almacenamiento |
|----------|----------------|
| MS-1 | PostgreSQL `importadora_vehiculos` :5432 |
| MS-2 | PostgreSQL `importadora_ms2` :5432 |
| MS-3 | DynamoDB Local :8000 + MinIO :9000 |

Credenciales Postgres: `postgres` / `admin123`  
MinIO consola: http://localhost:9001 (`minioadmin` / `minioadmin123`)

Ver [docs/BASES-DE-DATOS.md](docs/BASES-DE-DATOS.md)

### 2. Microservicio principal (MS-1)

```powershell
cd ms-1-principal
mvn spring-boot:run
```

### 2b. MS-3 (documentos + inspección IA)

```powershell
cd ms-3-dl
.\scripts\start.ps1
```

### 2c. MS-2 (logística + cotizador + blockchain)

```powershell
cd ms-2-ml
.\scripts\start.ps1
```

### 3. Verificar

- Health: http://localhost:8080/actuator/health
- Swagger UI: http://localhost:8080/swagger-ui.html (botón **Authorize** con el token JWT)

### Usuarios de demostración

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | ADMIN |
| vendedor | vendedor123 | VENDEDOR |
| cliente | cliente123 | CLIENTE |

### Ejemplo: login y crear vehículo

```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/auth/login" `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'

$headers = @{ Authorization = "Bearer $($login.token)" }

Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/vehiculos" `
  -Headers $headers -ContentType "application/json" `
  -Body '{"vin":"1HGBH41JXMN109186","marca":"Toyota","modelo":"Corolla","anio":2024,"color":"Blanco","precio":28500.00}'
```

### APIs disponibles (`/api/v1`)

- `auth/login`, `auth/register` — público
- `usuarios/{id}/password` — restablecer clave (solo ADMIN, vendedor/cliente)
- Ver [docs/RECUPERACION_CONTRASENA.md](docs/RECUPERACION_CONTRASENA.md) para recuperación por correo (pendiente)
- `vehiculos` — lectura pública; escritura ADMIN/VENDEDOR
- `clientes`, `pedidos`, `importaciones`, `facturas` — requieren JWT

## Estructura del monorepo

```
├── ms-1-principal/       # Spring Boot — núcleo de negocio
├── ms-2-ml/              # Django — ML + logística (:8081)
├── ms-3-dl/              # FastAPI + Python DL (:8082 / :5000)
├── frontend-angular/     # Portal web Angular
├── mobile-react-native/  # App móvil Expo (cliente)
├── infra/                # docker-compose, scripts
└── docs/                 # Arquitectura, Google login, recuperación de contraseña
```

### 4. Portal Angular + API Gateway

```powershell
cd frontend-angular
npm install
npm run start:kill
```

| Modo | URL | Descripción |
|------|-----|-------------|
| **Gateway (recomendado)** | http://localhost:8888 | Un solo puerto para web + MS-1 + MS-2 + MS-3 |
| Angular directo | http://localhost:4200 | Solo desarrollo frontend (proxy local) |

El gateway Nginx se levanta con `docker compose up -d` en `infra/`.  
Ver [docs/ARQUITECTURA-GATEWAY.md](docs/ARQUITECTURA-GATEWAY.md).

```powershell
cd infra
.\scripts\start-stack.ps1   # guía de arranque completo
```

### 5. App móvil (Expo)

```powershell
cd mobile-react-native
copy .env.example .env
npm install
npm start
```

Ver [mobile-react-native/README.md](mobile-react-native/README.md) para URL del API según emulador o dispositivo.

## Próximos pasos

- N8N automatización del flujo de 9 pasos
- Modelos ML/DL reales (TensorFlow / PyTorch)
- Blockchain productivo (hoy mock en MS-2)
