-- Flujo importadora completo: lotes, compra origen, entrega, traspaso

CREATE TABLE IF NOT EXISTS lotes_importacion (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(16) UNIQUE,
    numero_contenedor VARCHAR(40),
    naviera VARCHAR(80),
    puerto_origen VARCHAR(80),
    puerto_destino VARCHAR(80),
    estado VARCHAR(24) NOT NULL DEFAULT 'PLANIFICADO',
    fecha_embarque DATE,
    notas VARCHAR(500),
    ms2_embarque_id VARCHAR(64),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS lote_id BIGINT REFERENCES lotes_importacion(id);
ALTER TABLE lotes_importacion ADD COLUMN IF NOT EXISTS ms2_embarque_id VARCHAR(64);

CREATE TABLE IF NOT EXISTS compras_origen (
    id BIGSERIAL PRIMARY KEY,
    vehiculo_id BIGINT NOT NULL UNIQUE REFERENCES vehiculos(id),
    proveedor VARCHAR(120) NOT NULL,
    tipo_proveedor VARCHAR(24) NOT NULL,
    lote_subasta VARCHAR(80),
    precio_fob NUMERIC(14,2) NOT NULL,
    fecha_compra DATE NOT NULL,
    pais_origen VARCHAR(80),
    referencia_documento VARCHAR(80),
    notas VARCHAR(500),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entregas (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL UNIQUE REFERENCES pedidos(id),
    acta_numero VARCHAR(32),
    fecha_entrega DATE NOT NULL,
    lugar_entrega VARCHAR(120),
    recibido_por VARCHAR(120) NOT NULL,
    tipo_documento_recibe VARCHAR(24),
    numero_documento_recibe VARCHAR(40),
    kilometraje INTEGER,
    observaciones VARCHAR(500),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traspasos_propiedad (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL UNIQUE REFERENCES pedidos(id),
    tipo_comprador VARCHAR(24) NOT NULL,
    titular_nombre VARCHAR(160) NOT NULL,
    rtn VARCHAR(20),
    numero_traspaso VARCHAR(40),
    estado VARCHAR(24) NOT NULL DEFAULT 'PENDIENTE',
    notario VARCHAR(120),
    fecha_traspaso DATE,
    observaciones VARCHAR(500),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
