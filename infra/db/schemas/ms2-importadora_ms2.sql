-- =============================================================================
-- MS-2 — PostgreSQL: importadora_ms2
-- Motor: PostgreSQL 17 | Puerto: 5432 (mismo servidor, BASE DISTINTA)
-- Crear: infra/scripts/setup-databases.ps1
-- Migrar tablas: cd ms-2-ml && python manage.py migrate
-- =============================================================================

-- CREATE DATABASE importadora_ms2;

-- ─── logistica_embarque ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistica_embarque (
    id                  BIGSERIAL PRIMARY KEY,
    ms1_importacion_id  INTEGER UNIQUE,          -- FK lógica → MS-1.importaciones.id
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

-- etapa_actual: COMPRADO | EMBARCADO | EN_TRANSITO | EN_ADUANA | LIBERADO | EN_LOTE

-- ─── logistica_cotizacionhistorial ──────────────────────────────────────────
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

-- Nota: proveedores y blockchain siguen en datos semilla (fase ML posterior)
