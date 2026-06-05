# Importadora Web (Angular 19)

Portal administrativo conectado a **MS-1** (`http://localhost:8080`).

## Requisitos

- Node.js 20+
- MS-1 en ejecución (`mvn spring-boot:run`)

## Inicio

```powershell
cd frontend-angular
npm install
npm start
```

Abre http://localhost:4200 — el proxy redirige `/api` al backend.

## Usuarios demo

| Usuario | Contraseña | Acceso |
|---------|------------|--------|
| admin | admin123 | Todo |
| vendedor | vendedor123 | Sin eliminar vehículos |
| cliente | cliente123 | Vehículos, pedidos |
