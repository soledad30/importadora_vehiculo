-- Tabla de perfiles de vendedores (vinculada a usuarios con rol VENDEDOR)
CREATE TABLE IF NOT EXISTS vendedores (
    id                  BIGSERIAL PRIMARY KEY,
    codigo              VARCHAR(12) UNIQUE,
    usuario_id          BIGINT NOT NULL UNIQUE REFERENCES usuarios(id),
    nombre_completo     VARCHAR(160) NOT NULL,
    telefono            VARCHAR(30) NOT NULL,
    email               VARCHAR(120) NOT NULL,
    cedula              VARCHAR(30) NOT NULL,
    zona_asignada       VARCHAR(80),
    fecha_ingreso       DATE,
    meta_mensual        DECIMAL(14,2),
    comision_porcentaje DECIMAL(5,2),
    en_campo            BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendedores_email ON vendedores (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_vendedores_cedula ON vendedores (cedula);
