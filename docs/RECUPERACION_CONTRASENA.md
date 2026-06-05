# Recuperación de contraseña

## Implementado (fase actual)

### Restablecimiento por administrador

Cuando un **vendedor** o **cliente** olvida su contraseña, el **administrador** puede asignar una nueva desde:

- **Web:** menú **Usuarios** → botón **Restablecer contraseña** (solo filas VENDEDOR / CLIENTE activos).
- **API:** `PUT /api/v1/usuarios/{id}/password`  
  - Rol requerido: `ADMIN`  
  - Cuerpo: `{ "password": "nuevaClave123" }`  
  - No aplica a usuarios `ADMIN` ni inactivos.

El admin debe comunicar la nueva contraseña al usuario por un canal seguro (teléfono, presencial, etc.).

---

## Pendiente — recuperación automática (cliente y vendedor)

> **Nota de producto:** el usuario y el vendedor podrán recuperar su contraseña sin depender del admin.

### Flujo objetivo

1. En **Login** / **Registro**, enlace **«¿Olvidó su contraseña?»**.
2. Pantalla **Recuperar contraseña**: el usuario ingresa su **correo** registrado.
3. Al enviar **Recuperar**:
   - El backend valida que el email exista y pertenezca a un usuario **activo** (CLIENTE o VENDEDOR).
   - Se genera un **token de un solo uso** con expiración (p. ej. 1 hora).
   - Se envía un **correo** con asunto tipo *Recuperación de contraseña — Importadora* y un **enlace**:
     - `https://<frontend>/recuperar-contrasena?token=<token>`
4. El usuario abre el enlace, ingresa **nueva contraseña** + **confirmación** y guarda.
5. El token se invalida; redirección a **Login** con mensaje de éxito.

### Backend (por implementar)

| Pieza | Descripción |
|-------|-------------|
| `POST /api/v1/auth/forgot-password` | Body: `{ "email" }`. Respuesta genérica (no revelar si el email existe). |
| `POST /api/v1/auth/reset-password` | Body: `{ "token", "password", "confirmPassword" }`. Público. |
| Entidad / tabla | `password_reset_token` (usuario_id, token_hash, expira_en, usado) |
| Email | Spring Mail + plantilla HTML; variables: `app.mail.*` en `application.yml` |
| Seguridad | Token aleatorio (UUID), hash en BD, rate limit por IP/email |

### Frontend (por implementar)

| Ruta | Pantalla |
|------|----------|
| `/olvide-contrasena` | Formulario email + botón **Recuperar** |
| `/recuperar-contrasena` | Query `?token=...`, formulario nueva contraseña |

### Configuración sugerida (`application.yml`)

```yaml
app:
  mail:
    from: noreply@importadora.com
  frontend-url: http://localhost:4200
```

### Dependencias Maven (referencia)

- `spring-boot-starter-mail`
- Opcional: Thymeleaf para plantillas de correo

---

## Relación con Google Sign-In

Si el usuario solo usa **Google**, la recuperación por contraseña local no aplica; documentar en la pantalla de «Olvidé mi contraseña» que debe usar **Continuar con Google**.
