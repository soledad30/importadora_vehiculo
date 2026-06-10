-- =============================================================================
-- MS-2 | PostgreSQL | Base: importadora_ms2
-- Ejecutar:
--   docker exec -i importadora-postgres psql -U postgres -f - < ms2-setup.sql
--   o: psql -U postgres -h localhost -f ms2-setup.sql
-- =============================================================================

SELECT 'CREATE DATABASE importadora_ms2'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'importadora_ms2')\gexec

\connect importadora_ms2

-- embarques (enlace MS-1: ms1_importacion_id)
CREATE TABLE IF NOT EXISTS logistica_embarque (
    id                  BIGSERIAL PRIMARY KEY,
    ms1_importacion_id  INTEGER UNIQUE,
    codigo              VARCHAR(32)  NOT NULL,
    vehiculo            VARCHAR(120) NOT NULL,
    referencia          VARCHAR(120) NOT NULL DEFAULT '',
    origen              VARCHAR(80)  NOT NULL DEFAULT '',
    destino             VARCHAR(80)  NOT NULL DEFAULT '',
    naviera             VARCHAR(80)  NOT NULL DEFAULT '',
    etapa_actual        VARCHAR(24)  NOT NULL DEFAULT 'COMPRADO',
    fecha_estimada      DATE,
    creado_en           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- historial cotizaciones
CREATE TABLE IF NOT EXISTS logistica_cotizacionhistorial (
    id          BIGSERIAL PRIMARY KEY,
    vehiculo    VARCHAR(120)   NOT NULL,
    cif         NUMERIC(12,2)  NOT NULL,
    impuestos   NUMERIC(12,2)  NOT NULL,
    total       NUMERIC(12,2)  NOT NULL,
    margen      INTEGER        NOT NULL DEFAULT 30,
    venta       NUMERIC(12,2)  NOT NULL,
    creado_en   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

\echo 'MS-2 OK: importadora_ms2'
