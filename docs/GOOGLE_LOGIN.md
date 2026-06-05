# Inicio de sesión con Google

## 1. Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto (o usar uno existente)
3. **APIs y servicios** → **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth**
4. Tipo: **Aplicación web**
5. **Orígenes autorizados de JavaScript:**
   - `http://localhost:4200`
6. Guardar el **Client ID** (termina en `.apps.googleusercontent.com`)

## 2. Backend

En PowerShell, antes de `mvn spring-boot:run`:

```powershell
$env:GOOGLE_CLIENT_ID='TU_CLIENT_ID.apps.googleusercontent.com'
$env:POSTGRES_PASSWORD='admin123'
mvn spring-boot:run
```

O en `application.yml` / variables de entorno del servidor.

## 3. Usuario en la base de datos

Google solo funciona si el **email de la cuenta Google** coincide con el **email** de un usuario ya registrado en el sistema.

Usuarios demo:

| Email | Usuario |
|-------|---------|
| admin@importadora.com | admin |
| vendedor@importadora.com | vendedor |
| cliente@importadora.com | cliente |

Cree usuarios en **Usuarios** (como admin) con el mismo email que usará en Google.

## 4. Probar

1. Reiniciar backend y frontend
2. Abrir `http://localhost:4200/login`
3. Clic en **Continuar con Google**
