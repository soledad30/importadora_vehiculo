# App móvil — Importadora Vehículos (React Native / Expo)

Cliente móvil para **MS-1** (catálogo, pedidos, login JWT) e **inspección con IA** vía MS-1 → MS-3.

## Requisitos

- Node.js 20+
- **JDK 17** para builds Android (Gradle no soporta Java 25)
- Expo Go en el dispositivo o emulador Android/iOS

## Configuración

```powershell
cd mobile-react-native
copy .env.example .env
npm install
```

Edita `.env` según dónde corre el backend:

| Entorno | `EXPO_PUBLIC_API_URL` |
|---------|------------------------|
| Emulador Android | `http://10.0.2.2:8080` |
| Simulador iOS / web | `http://localhost:8080` |
| Dispositivo físico | `http://<IP-LAN-de-tu-PC>:8080` |

## Iniciar

En Windows, usa el script que fija JDK 17 automáticamente (evita el error `Unsupported class file major version 69`):

```powershell
npm run start:dev
```

Alternativa directa:

```powershell
.\scripts\start-dev.ps1
```

Solo Expo Go (sin forzar JDK 17):

```powershell
npm start
```

Escanea el QR con Expo Go o pulsa `a` (Android) / `i` (iOS).

Build Android nativo (Gradle):

```powershell
npm run android:dev
```

## Usuario demo

| Usuario | Contraseña |
|---------|------------|
| cliente | cliente123 |

## Flujos

1. **Catálogo** — lista vehículos disponibles (GET público `/api/v1/vehiculos`).
2. **Crear pedido** — POST `/api/v1/pedidos` (rol CLIENTE).
3. **Mis pedidos** — GET `/api/v1/pedidos/cliente/{id}`.
4. **Inspección IA** — sube foto → POST `/api/v1/pedidos/{id}/inspeccion` → MS-1 orquesta MS-3.

Asegúrate de tener levantados MS-1 (`:8080`), MS-3 (`:8082`) y el worker DL (`:5000`) para la inspección.
