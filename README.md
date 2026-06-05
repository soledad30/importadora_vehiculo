# Importadora de Vehículos 2026

Sistema de microservicios para gestión de ventas, importaciones y logística de vehículos.

## Stack (fase actual)

| Componente | Tecnología | Estado |
|------------|------------|--------|
| MS-1 Principal | Spring Boot 3.4 + Java **17** + JWT | En desarrollo |
| Base de datos | PostgreSQL **17** | Docker / local |
| MS-2 ML | Django | Pendiente |
| MS-3 DL | Nest.js + Python | Pendiente |
| Web | Angular 19 | En desarrollo |
| Móvil | React Native | Pendiente |

## Requisitos

- Java 17 (recomendado para MS-1; Java 25 no es necesario en esta fase)
- Maven 3.9+
- Docker Desktop (para PostgreSQL en contenedor)

## Inicio rápido

### 1. Base de datos

```powershell
cd infra
docker compose up -d
```

Credenciales por defecto:

- Host: `localhost:5432`
- Base: `importadora_vehiculos`
- Usuario: `postgres`
- Contraseña: `admin123`

### 2. Microservicio principal (MS-1)

```powershell
cd ms-1-principal
mvn spring-boot:run
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
├── ms-2-ml/              # Django — ML (pendiente)
├── ms-3-dl/              # Nest + Python — DL (pendiente)
├── frontend-angular/     # Portal admin (pendiente)
├── mobile-react-native/  # App móvil (pendiente)
├── infra/                # docker-compose, scripts
└── docs/                 # Arquitectura, Google login, recuperación de contraseña
```

### 4. Portal Angular

```powershell
cd frontend-angular
npm install
npm start
```

Abre http://localhost:4200 (requiere MS-1 en puerto 8080).

## Próximo paso

**Paso 3:** microservicio **MS-3** (Nest.js + Python DL) para análisis de fotos.
