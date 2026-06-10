# Historias de Usuario — MS-1 Principal

Documento de backlog funcional derivado de los [17 casos de uso](./CASOS_DE_USO_MS1.md) del microservicio principal.

| Campo | Valor |
|-------|-------|
| **Sistema** | Importadora de Vehículos 2026 — MS-1 |
| **Total HU** | 17 |
| **Tiempo de desarrollo MS-1** | **1 semana (40 horas)** |
| **Formato** | Como / Quiero / Para + Criterios de aceptación |
| **Documento Word** | [HISTORIAS_USUARIO_MS1.docx](./HISTORIAS_USUARIO_MS1.docx) |

---

## HU1 — Acceso al sistema

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU1 |
| **Nombre corto** | Acceso al sistema |
| **Módulo** | Seguridad |
| **Tiempo estimado** | 16 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 16 |
| **CU relacionado** | CU-01 |

**Como:** Usuario registrado  
**Quiero:** Iniciar sesión con credenciales o Google y cerrar sesión  
**Para:** Acceder de forma segura a las funcionalidades del sistema según mi rol

**Descripción:** Como usuario registrado, quiero autenticarme en la plataforma (usuario/contraseña o Google) y cerrar sesión cuando termine, para proteger mis datos y operaciones.

**Proceso/Lógica**
1. Acceder a la pantalla de inicio de sesión.
2. Ingresar usuario y contraseña, o seleccionar "Continuar con Google".
3. El sistema valida credenciales o token Google en `POST /api/v1/auth/login` o `/auth/google`.
4. El sistema emite JWT con rol (ADMIN, VENDEDOR, CLIENTE).
5. Redirigir al panel principal según permisos del rol.
6. Cerrar sesión eliminando el token del cliente (sesión stateless).

**Criterios de aceptación**
1. Permite acceso con credenciales válidas y retorna JWT.
2. Permite acceso con Google si el email está registrado y verificado.
3. Muestra mensaje de error con credenciales inválidas o usuario inactivo.
4. El cierre de sesión elimina el token y bloquea rutas protegidas.
5. Usuario CLIENTE recibe `clienteId` en la respuesta de login.

---

## HU2 — Registro de usuarios

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU2 |
| **Nombre corto** | Registro de usuarios |
| **Módulo** | Seguridad |
| **Tiempo estimado** | 12 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 12 |
| **CU relacionado** | CU-02 |

**Como:** Visitante  
**Quiero:** Crear una cuenta como Cliente o Vendedor  
**Para:** Acceder al sistema sin depender del administrador

**Descripción:** Como visitante, quiero registrarme en la plataforma eligiendo rol Cliente o Vendedor, para obtener acceso inmediato al sistema.

**Proceso/Lógica**
1. Acceder a la pantalla de registro.
2. Completar nombre, email, teléfono, contraseña, confirmación y rol.
3. El sistema valida unicidad del email y coincidencia de contraseñas.
4. Si el rol es CLIENTE, crea registro de cliente con código `CLI-XXX`.
5. El sistema crea usuario activo y emite JWT automáticamente.
6. Redirige al panel según rol.

**Criterios de aceptación**
1. Registra usuarios con rol CLIENTE o VENDEDOR.
2. Rechaza registro con rol ADMIN.
3. Rechaza email duplicado con mensaje claro.
4. Rechaza contraseñas que no coinciden.
5. Tras registro exitoso el usuario queda autenticado (HTTP 201 + JWT).

---

## HU3 — Administración de usuarios

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU3 |
| **Nombre corto** | Administración de usuarios |
| **Módulo** | Seguridad |
| **Tiempo estimado** | 20 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 20 |
| **CU relacionado** | CU-03 |

**Como:** Administrador  
**Quiero:** Gestionar cuentas de usuario del sistema  
**Para:** Controlar quién tiene acceso y restablecer contraseñas olvidadas

**Descripción:** Como administrador, quiero listar, crear, activar/desactivar usuarios y restablecer contraseñas, para administrar el acceso al sistema.

**Proceso/Lógica**
1. Acceder al módulo de usuarios (solo ADMIN).
2. Listar usuarios existentes.
3. Crear usuario con username, email, contraseña, rol y cliente vinculado (si aplica).
4. Activar o desactivar usuarios según necesidad operativa.
5. Restablecer contraseña de vendedores o clientes que la olvidaron.

**Criterios de aceptación**
1. Solo ADMIN puede acceder al módulo.
2. Permite crear usuarios con roles ADMIN, VENDEDOR o CLIENTE.
3. No permite username ni email duplicados.
4. Usuario CLIENTE debe vincularse a un cliente existente.
5. Restablecer contraseña actualiza la clave con BCrypt.

---

## HU4 — Gestión de clientes

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU4 |
| **Nombre corto** | Gestión de clientes |
| **Módulo** | Clientes |
| **Tiempo estimado** | 24 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 24 |
| **CU relacionado** | CU-04 |

**Como:** Administrador o Vendedor  
**Quiero:** Registrar y mantener la cartera de clientes  
**Para:** Gestionar las relaciones comerciales de la importadora

**Descripción:** Como admin o vendedor, quiero registrar, editar, activar/desactivar clientes y asignarlos a mi cartera, para organizar las ventas por responsable comercial.

**Proceso/Lógica**
1. Acceder al módulo de clientes.
2. Registrar cliente con documento, datos personales, contacto y tipo (VIP, REGULAR, NUEVO).
3. Editar datos de clientes existentes.
4. Activar/desactivar clientes sin eliminar historial.
5. Vendedor puede asignarse un cliente con "Asignar a mí".
6. Admin puede desactivar clientes definitivamente.

**Criterios de aceptación**
1. ADMIN y VENDEDOR pueden crear y editar clientes.
2. Solo ADMIN puede eliminar/desactivar vía DELETE.
3. No permite documento ni email duplicados.
4. Cliente inactivo no puede usarse en nuevos pedidos.
5. Asignación a vendedor queda registrada en el cliente.

---

## HU5 — Consulta de perfil del cliente

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU5 |
| **Nombre corto** | Consulta de perfil del cliente |
| **Módulo** | Clientes |
| **Tiempo estimado** | 8 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Media |
| **Estimación PHU** | 8 |
| **CU relacionado** | CU-05 |

**Como:** Cliente  
**Quiero:** Ver mi información personal y mis pedidos  
**Para:** Hacer seguimiento de mis compras en la importadora

**Descripción:** Como cliente autenticado, quiero consultar mi perfil y los pedidos asociados a mi cuenta, para conocer el estado de mis operaciones.

**Proceso/Lógica**
1. Iniciar sesión como CLIENTE.
2. Acceder a "Mi cuenta" o "Mis pedidos".
3. El sistema valida que solo se consulten datos del cliente vinculado a la sesión.
4. Mostrar información personal y listado de pedidos propios.

**Criterios de aceptación**
1. Cliente solo ve su propio perfil y pedidos.
2. Bloquea acceso a datos de otros clientes (403).
3. Muestra pedidos con estado, vehículo y totales.
4. Requiere sesión JWT activa.

---

## HU6 — Consulta de catálogo

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU6 |
| **Nombre corto** | Consulta de catálogo |
| **Módulo** | Inventario |
| **Tiempo estimado** | 12 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 12 |
| **CU relacionado** | CU-06 |

**Como:** Visitante o usuario del sistema  
**Quiero:** Ver el catálogo de vehículos disponibles  
**Para:** Conocer las opciones de compra antes de solicitar un pedido

**Descripción:** Como visitante, quiero listar y ver el detalle de vehículos en inventario, para explorar la oferta de la importadora sin necesidad de registrarme.

**Proceso/Lógica**
1. Acceder al catálogo público de vehículos.
2. Listar vehículos con marca, modelo, año, precio, estado e imagen.
3. Seleccionar un vehículo para ver detalle completo.
4. Endpoint público: `GET /api/v1/vehiculos`.

**Criterios de aceptación**
1. Catálogo accesible sin autenticación.
2. Muestra listado paginable o completo de vehículos.
3. Detalle incluye VIN, precio, color, estado y país de origen.
4. Retorna 404 si el vehículo no existe.

---

## HU7 — Gestión de inventario

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU7 |
| **Nombre corto** | Gestión de inventario |
| **Módulo** | Inventario |
| **Tiempo estimado** | 20 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 20 |
| **CU relacionado** | CU-07 |

**Como:** Administrador o Vendedor  
**Quiero:** Registrar, actualizar y eliminar vehículos  
**Para:** Mantener actualizado el inventario de la importadora

**Descripción:** Como admin o vendedor, quiero administrar el inventario de vehículos, para que el catálogo refleje la disponibilidad real de stock.

**Proceso/Lógica**
1. Acceder al módulo de inventario.
2. Registrar vehículo con datos técnicos, precio e imagen.
3. Actualizar información de vehículos existentes.
4. Admin puede eliminar vehículos del sistema.
5. Nuevo vehículo inicia en estado DISPONIBLE.

**Criterios de aceptación**
1. ADMIN y VENDEDOR pueden crear y editar vehículos.
2. Solo ADMIN puede eliminar vehículos.
3. Vehículo nuevo queda en estado DISPONIBLE.
4. Validación de campos obligatorios en formulario y API.
5. Cambios reflejados inmediatamente en el catálogo (CU-06).

---

## HU8 — Creación de pedidos

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU8 |
| **Nombre corto** | Creación de pedidos |
| **Módulo** | Pedidos |
| **Tiempo estimado** | 24 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 24 |
| **CU relacionado** | CU-08 |

**Como:** Administrador o Vendedor  
**Quiero:** Crear un pedido de venta vinculando cliente y vehículo  
**Para:** Iniciar el proceso comercial de importación y venta

**Descripción:** Como vendedor, quiero registrar un pedido asociando un cliente activo con un vehículo disponible, para reservar el inventario y calcular el total de la operación.

**Proceso/Lógica**
1. Seleccionar cliente activo y vehículo disponible.
2. Opcionalmente asignar vendedor (auto-asignación si el actor es VENDEDOR).
3. Sistema calcula: precio base + impuestos (15%) + envío ($1,500 default).
4. Crear pedido en estado PENDIENTE con código PED-XXX.
5. Reservar vehículo (estado RESERVADO).
6. Notificar al cliente y alertar si no hay vendedor asignado.

**Criterios de aceptación**
1. Rechaza cliente inactivo o vehículo no disponible.
2. Rechaza vehículo con pedido activo existente.
3. Calcula total con desglose financiero correcto.
4. Genera código único PED-{id}.
5. Dispara notificaciones automáticas (HU15).

---

## HU9 — Ciclo de vida del pedido

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU9 |
| **Nombre corto** | Ciclo de vida del pedido |
| **Módulo** | Pedidos |
| **Tiempo estimado** | 32 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 32 |
| **CU relacionado** | CU-09 |

**Como:** Administrador o Vendedor  
**Quiero:** Avanzar o cancelar un pedido en su flujo comercial  
**Para:** Controlar el proceso desde la confirmación hasta la entrega

**Descripción:** Como vendedor, quiero confirmar, iniciar importación, entregar o cancelar pedidos, para gestionar el ciclo completo de venta e importación.

**Proceso/Lógica**
1. Confirmar pedido PENDIENTE → CONFIRMADO.
2. Iniciar importación CONFIRMADO → EN_IMPORTACION (crea registro aduanero).
3. Entregar pedido EN_IMPORTACION → ENTREGADO (vehículo → VENDIDO).
4. Cancelar o cerrar con motivo en cualquier estado activo.
5. Sincronizar estados de pedido, vehículo e importación.
6. Notificar al cliente en cada cambio de estado.

**Criterios de aceptación**
1. Solo permite transiciones de estado válidas.
2. Entrega requiere pedido en EN_IMPORTACION.
3. Cancelar libera vehículo a DISPONIBLE.
4. Cerrar con motivo registra razón en notas del pedido.
5. Vendedor no puede cerrar pedidos de otro vendedor.

---

## HU10 — Asignación de pedidos

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU10 |
| **Nombre corto** | Asignación de pedidos |
| **Módulo** | Pedidos |
| **Tiempo estimado** | 8 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Media |
| **Estimación PHU** | 8 |
| **CU relacionado** | CU-10 |

**Como:** Vendedor  
**Quiero:** Tomar pedidos que no tienen vendedor asignado  
**Para:** Hacerme responsable de cerrar la venta

**Descripción:** Como vendedor, quiero auto-asignarme pedidos sin responsable comercial, para atender oportunidades de venta pendientes.

**Proceso/Lógica**
1. Ver alerta o listado de pedidos sin vendedor.
2. Seleccionar "Tomar pedido".
3. Sistema asigna vendedor logueado al pedido.
4. Si ya tiene vendedor, retorna sin cambios.

**Criterios de aceptación**
1. Solo VENDEDOR puede ejecutar la acción.
2. Asigna correctamente al usuario logueado.
3. Operación idempotente si ya tiene vendedor.
4. Pedido tomado aparece en listado del vendedor (HU11).

---

## HU11 — Consulta de pedidos

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU11 |
| **Nombre corto** | Consulta de pedidos |
| **Módulo** | Pedidos |
| **Tiempo estimado** | 12 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 12 |
| **CU relacionado** | CU-11 |

**Como:** Administrador, Vendedor o Cliente  
**Quiero:** Consultar pedidos según mi rol  
**Para:** Hacer seguimiento de las operaciones de venta

**Descripción:** Como usuario autenticado, quiero listar y ver detalle de pedidos filtrados por mi rol, para monitorear el avance de las ventas.

**Proceso/Lógica**
1. ADMIN: ve todos los pedidos.
2. VENDEDOR: ve pedidos propios y sin asignar.
3. CLIENTE: ve solo pedidos de su cuenta.
4. Consultar listado general, por cliente o por ID.

**Criterios de aceptación**
1. Filtrado correcto por rol.
2. Cliente no accede a pedidos ajenos (403).
3. Detalle incluye cliente, vehículo, vendedor, estados y totales.
4. Requiere JWT válido.

---

## HU12 — Trazabilidad de importaciones

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU12 |
| **Nombre corto** | Trazabilidad de importaciones |
| **Módulo** | Importaciones |
| **Tiempo estimado** | 28 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 28 |
| **CU relacionado** | CU-12 |

**Como:** Administrador  
**Quiero:** Registrar y actualizar la trazabilidad aduanera  
**Para:** Controlar el proceso logístico de vehículos importados

**Descripción:** Como administrador, quiero gestionar registros de importación con datos aduaneros y logísticos, para dar seguimiento al arribo de vehículos.

**Proceso/Lógica**
1. Crear importación vinculada a un pedido (país, aduana, puertos, naviera, BL, contenedor).
2. Actualizar estado: SOLICITADA → EN_ADUANA → LIBERADA → EN_TRANSITO → COMPLETADA.
3. También se crea automáticamente al iniciar importación desde pedido (HU9).
4. Al entregar pedido, importación pasa a COMPLETADA.

**Criterios de aceptación**
1. Solo ADMIN gestiona importaciones.
2. No permite importación duplicada por pedido.
3. Genera código IMP-{id}.
4. Sincroniza estados con pedido y vehículo.
5. Valores default: país "Estados Unidos", aduana "Puerto Cortés".

---

## HU13 — Facturación de pedidos

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU13 |
| **Nombre corto** | Facturación de pedidos |
| **Módulo** | Facturación |
| **Tiempo estimado** | 24 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Alta |
| **Estimación PHU** | 24 |
| **CU relacionado** | CU-13 |

**Como:** Administrador o Vendedor  
**Quiero:** Crear, emitir y registrar pago de facturas  
**Para:** Documentar formalmente las ventas realizadas

**Descripción:** Como vendedor, quiero generar facturas vinculadas a pedidos confirmados, emitirlas y registrar su pago, para completar el proceso de cobro.

**Proceso/Lógica**
1. Seleccionar pedido confirmado o en proceso (≠ PENDIENTE, ≠ CANCELADO).
2. Crear factura en BORRADOR con número FAC-{año}-{secuencia}.
3. Emitir factura → EMITIDA.
4. Registrar pago → PAGADA.
5. Consultar siguiente número disponible antes de crear.

**Criterios de aceptación**
1. Una sola factura por pedido.
2. No factura pedidos PENDIENTES o CANCELADOS.
3. Solo emite facturas en BORRADOR.
4. Solo paga facturas EMITIDAS.
5. Numeración secuencial automática por año.

---

## HU14 — Gestión del equipo de ventas

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU14 |
| **Nombre corto** | Gestión del equipo de ventas |
| **Módulo** | Vendedores |
| **Tiempo estimado** | 20 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Media |
| **Estimación PHU** | 20 |
| **CU relacionado** | CU-14 |

**Como:** Administrador  
**Quiero:** Administrar vendedores y ver sus KPIs  
**Para:** Supervisar el desempeño del equipo comercial

**Descripción:** Como administrador, quiero registrar vendedores, activarlos/desactivarlos y consultar indicadores de desempeño, para gestionar el equipo de ventas.

**Proceso/Lógica**
1. Listar vendedores del sistema.
2. Registrar nuevo vendedor vinculado a usuario.
3. Activar/desactivar vendedores.
4. Consultar resumen KPIs: ranking y métricas por vendedor.

**Criterios de aceptación**
1. Solo ADMIN accede al módulo.
2. Permite CRUD de vendedores.
3. Resumen KPIs muestra ranking de vendedores.
4. Vendedor inactivo no aparece en asignaciones nuevas.

---

## HU15 — Centro de notificaciones

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU15 |
| **Nombre corto** | Centro de notificaciones |
| **Módulo** | Notificaciones |
| **Tiempo estimado** | 16 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Media |
| **Estimación PHU** | 16 |
| **CU relacionado** | CU-15 |

**Como:** Usuario autenticado  
**Quiero:** Ver y gestionar mis alertas del sistema  
**Para:** Estar informado de eventos relevantes a mi rol

**Descripción:** Como usuario, quiero consultar notificaciones, filtrarlas por categoría, contar no leídas y marcarlas como leídas, para no perder eventos importantes del negocio.

**Proceso/Lógica**
1. Acceder al centro de notificaciones.
2. Listar alertas filtradas por rol y usuario.
3. Filtrar por categoría (PEDIDO, FACTURA, IMPORTACION, etc.).
4. Ver contador de no leídas en badge.
5. Marcar individual o todas como leídas.
6. Sistema genera alertas automáticas en eventos de pedidos.

**Criterios de aceptación**
1. Notificaciones filtradas por rol del usuario.
2. Contador de no leídas actualizado en tiempo real.
3. Marcar leída solo afecta notificaciones propias.
4. Alertas automáticas al crear, confirmar, importar, entregar o cancelar pedidos.
5. Categorías: PEDIDO, FACTURA, IMPORTACION, STOCK, SISTEMA, etc.

---

## HU16 — Dashboard ejecutivo

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU16 |
| **Nombre corto** | Dashboard ejecutivo |
| **Módulo** | Reportes |
| **Tiempo estimado** | 20 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Media |
| **Estimación PHU** | 20 |
| **CU relacionado** | CU-16 |

**Como:** Administrador  
**Quiero:** Ver métricas globales del negocio  
**Para:** Tomar decisiones estratégicas con datos actualizados

**Descripción:** Como administrador, quiero un panel con ventas, stock, pedidos, clientes e importaciones del negocio completo, para monitorear la operación general.

**Proceso/Lógica**
1. Acceder al dashboard de reportes (solo ADMIN).
2. Consultar `GET /api/v1/reportes/resumen`.
3. Mostrar: ventas totales, ventas del mes, pedidos por estado, stock, clientes activos, importaciones pendientes, facturas y ranking de vendedores.

**Criterios de aceptación**
1. Solo ADMIN accede al dashboard global.
2. Ventas totales suman pedidos ENTREGADOS.
3. Muestra conteos de pedidos por estado.
4. Incluye ranking top vendedores.
5. Datos calculados desde base de datos en tiempo de consulta.

---

## HU17 — Dashboard del vendedor

| Campo | Valor |
|-------|-------|
| **HU-Nro.** | HU17 |
| **Nombre corto** | Dashboard del vendedor |
| **Módulo** | Reportes |
| **Tiempo estimado** | 12 horas |
| **Desarrollador** | [Asignar] |
| **Prioridad** | Media |
| **Estimación PHU** | 12 |
| **CU relacionado** | CU-17 |

**Como:** Vendedor  
**Quiero:** Ver un resumen de mis ventas y operaciones  
**Para:** Conocer mi desempeño comercial personal

**Descripción:** Como vendedor, quiero consultar métricas filtradas a mis pedidos y ventas, para evaluar mi productividad.

**Proceso/Lógica**
1. Iniciar sesión como VENDEDOR.
2. Acceder a "Mi resumen" (`GET /api/v1/reportes/mi-resumen`).
3. Ver ventas, pedidos y operaciones propias del vendedor logueado.

**Criterios de aceptación**
1. Solo VENDEDOR accede a su resumen personal.
2. Datos filtrados exclusivamente al vendedor autenticado.
3. No expone información de otros vendedores.
4. Misma estructura de métricas que dashboard global pero con alcance personal.

---

## Resumen del backlog

**Tiempo total de desarrollo MS-1: 1 semana (40 horas)**

| HU | Nombre | Módulo | PHU | Prioridad | CU |
|----|--------|--------|-----|-----------|-----|
| HU1 | Acceso al sistema | Seguridad | 3 | Alta | CU-01 |
| HU2 | Registro de usuarios | Seguridad | 2 | Alta | CU-02 |
| HU3 | Administración de usuarios | Seguridad | 3 | Alta | CU-03 |
| HU4 | Gestión de clientes | Clientes | 3 | Alta | CU-04 |
| HU5 | Consulta de perfil del cliente | Clientes | 1 | Media | CU-05 |
| HU6 | Consulta de catálogo | Inventario | 2 | Alta | CU-06 |
| HU7 | Gestión de inventario | Inventario | 3 | Alta | CU-07 |
| HU8 | Creación de pedidos | Pedidos | 3 | Alta | CU-08 |
| HU9 | Ciclo de vida del pedido | Pedidos | 4 | Alta | CU-09 |
| HU10 | Asignación de pedidos | Pedidos | 1 | Media | CU-10 |
| HU11 | Consulta de pedidos | Pedidos | 2 | Alta | CU-11 |
| HU12 | Trazabilidad de importaciones | Importaciones | 3 | Alta | CU-12 |
| HU13 | Facturación de pedidos | Facturación | 3 | Alta | CU-13 |
| HU14 | Gestión del equipo de ventas | Vendedores | 2 | Media | CU-14 |
| HU15 | Centro de notificaciones | Notificaciones | 2 | Media | CU-15 |
| HU16 | Dashboard ejecutivo | Reportes | 2 | Media | CU-16 |
| HU17 | Dashboard del vendedor | Reportes | 1 | Media | CU-17 |
| | | **TOTAL** | **40 h (1 semana)** | | |

---

## Trazabilidad CU ↔ HU

| CU | HU |
|----|-----|
| CU-01 Autenticarse | HU1 |
| CU-02 Registrarse | HU2 |
| CU-03 Gestionar usuarios | HU3 |
| CU-04 Gestionar clientes | HU4 |
| CU-05 Consultar datos de cliente | HU5 |
| CU-06 Consultar catálogo | HU6 |
| CU-07 Gestionar inventario | HU7 |
| CU-08 Crear pedido | HU8 |
| CU-09 Gestionar ciclo del pedido | HU9 |
| CU-10 Tomar pedido sin vendedor | HU10 |
| CU-11 Consultar pedidos | HU11 |
| CU-12 Gestionar importaciones | HU12 |
| CU-13 Gestionar facturas | HU13 |
| CU-14 Gestionar equipo de ventas | HU14 |
| CU-15 Consultar y gestionar alertas | HU15 |
| CU-16 Consultar métricas del negocio | HU16 |
| CU-17 Consultar métricas propias | HU17 |
