-- =============================================================================
-- MS-1 | PostgreSQL | Base: importadora_vehiculos
-- Ejecutar:
--   docker exec -i importadora-postgres psql -U postgres -f - < ms1-setup.sql
--   o: psql -U postgres -h localhost -f ms1-setup.sql
-- =============================================================================

SELECT 'CREATE DATABASE importadora_vehiculos'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'importadora_vehiculos')\gexec

\connect importadora_vehiculos

-- clientes
CREATE TABLE IF NOT EXISTS clientes (
    id                   BIGSERIAL PRIMARY KEY,
    tipo_documento       VARCHAR(10)  NOT NULL,
    numero_documento     VARCHAR(20)  NOT NULL UNIQUE,
    nombres              VARCHAR(80)  NOT NULL,
    apellidos            VARCHAR(80)  NOT NULL,
    email                VARCHAR(120) NOT NULL,
    telefono             VARCHAR(20),
    codigo               VARCHAR(12)  UNIQUE,
    direccion            VARCHAR(200),
    ciudad               VARCHAR(80),
    notas                VARCHAR(500),
    tipo_cliente         VARCHAR(20)  NOT NULL DEFAULT 'REGULAR',
    activo               BOOLEAN      NOT NULL DEFAULT TRUE,
    vendedor_asignado_id BIGINT,
    creado_en            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actualizado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(60)  NOT NULL UNIQUE,
    password        VARCHAR(120) NOT NULL,
    email           VARCHAR(120) NOT NULL UNIQUE,
    rol             VARCHAR(20)  NOT NULL,
    cliente_id      BIGINT REFERENCES clientes(id),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE clientes ADD CONSTRAINT fk_clientes_vendedor
        FOREIGN KEY (vendedor_asignado_id) REFERENCES usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- vehiculos
CREATE TABLE IF NOT EXISTS vehiculos (
    id              BIGSERIAL PRIMARY KEY,
    vin             VARCHAR(32)    NOT NULL UNIQUE,
    marca           VARCHAR(80)    NOT NULL,
    modelo          VARCHAR(80)    NOT NULL,
    anio            INTEGER        NOT NULL,
    color           VARCHAR(40)    NOT NULL,
    precio          NUMERIC(14,2)  NOT NULL,
    estado          VARCHAR(24)    NOT NULL DEFAULT 'DISPONIBLE',
    imagen_url      VARCHAR(500),
    pais_origen     VARCHAR(80),
    es_importado    BOOLEAN        NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- vendedores
CREATE TABLE IF NOT EXISTS vendedores (
    id                   BIGSERIAL PRIMARY KEY,
    codigo               VARCHAR(12) UNIQUE,
    usuario_id           BIGINT NOT NULL UNIQUE REFERENCES usuarios(id),
    nombre_completo      VARCHAR(160) NOT NULL,
    telefono             VARCHAR(30)  NOT NULL,
    email                VARCHAR(120) NOT NULL,
    cedula               VARCHAR(30)  NOT NULL,
    zona_asignada        VARCHAR(80),
    fecha_ingreso        DATE,
    meta_mensual         NUMERIC(14,2),
    comision_porcentaje  NUMERIC(5,2),
    en_campo             BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id              BIGSERIAL PRIMARY KEY,
    cliente_id      BIGINT NOT NULL REFERENCES clientes(id),
    vehiculo_id     BIGINT NOT NULL REFERENCES vehiculos(id),
    vendedor_id     BIGINT REFERENCES usuarios(id),
    codigo          VARCHAR(12) UNIQUE,
    estado          VARCHAR(24) NOT NULL DEFAULT 'PENDIENTE',
    precio_base     NUMERIC(14,2) NOT NULL,
    impuestos       NUMERIC(14,2) NOT NULL,
    envio           NUMERIC(14,2) NOT NULL,
    total           NUMERIC(14,2) NOT NULL,
    notas           VARCHAR(500),
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- importaciones (enlace MS-2: ms2_embarque_id)
CREATE TABLE IF NOT EXISTS importaciones (
    id                      BIGSERIAL PRIMARY KEY,
    codigo                  VARCHAR(16) UNIQUE,
    pedido_id               BIGINT NOT NULL UNIQUE REFERENCES pedidos(id),
    pais_origen             VARCHAR(80) NOT NULL,
    aduana                  VARCHAR(80) NOT NULL,
    numero_despacho         VARCHAR(40),
    puerto_origen           VARCHAR(80),
    puerto_destino          VARCHAR(80),
    naviera                 VARCHAR(80),
    numero_bl               VARCHAR(40),
    numero_contenedor       VARCHAR(40),
    ms2_embarque_id         VARCHAR(64),
    estado                  VARCHAR(24) NOT NULL DEFAULT 'SOLICITADA',
    fecha_inicio            DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_estimada_entrega  DATE,
    creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- facturas
CREATE TABLE IF NOT EXISTS facturas (
    id              BIGSERIAL PRIMARY KEY,
    pedido_id       BIGINT NOT NULL UNIQUE REFERENCES pedidos(id),
    numero_factura  VARCHAR(30) NOT NULL UNIQUE,
    monto           NUMERIC(14,2) NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    fecha_emision   DATE NOT NULL DEFAULT CURRENT_DATE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id                  BIGSERIAL PRIMARY KEY,
    categoria           VARCHAR(24) NOT NULL,
    nivel               VARCHAR(16) NOT NULL,
    titulo              VARCHAR(120) NOT NULL,
    mensaje             VARCHAR(500) NOT NULL,
    rol_destino         VARCHAR(20),
    usuario_destino_id  BIGINT,
    referencia_tipo     VARCHAR(32),
    referencia_id       BIGINT,
    flujo               VARCHAR(120),
    leida               BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

\echo 'MS-1 OK: importadora_vehiculos'
