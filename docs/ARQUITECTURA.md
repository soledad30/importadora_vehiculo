# Arquitectura

Ver diagrama del proyecto en la documentación del curso.

## Flujo principal (9 pasos)

1. Cliente consulta
2. MS-1 registra pedido
3. N8N notifica vendedor
4. MS-3 analiza fotos
5. Blockchain — ingreso
6. MS-2 predice demanda
7. Notificación al cliente
8. Documentos en S3
9. Blockchain — entrega

## MS-1 — API base

Prefijo: `/api/v1`

| Recurso | Estado |
|---------|--------|
| `/auth/login` | Implementado (JWT) |
| `/vehiculos` | Implementado |
| `/clientes` | Implementado |
| `/pedidos` | Implementado (+ confirmar, importación, entregar, cancelar) |
| `/importaciones` | Implementado |
| `/facturas` | Implementado (+ emitir, pagar) |

## Roles

- **ADMIN:** acceso total
- **VENDEDOR:** operaciones comerciales
- **CLIENTE:** catálogo, crear pedidos, consultar sus datos
