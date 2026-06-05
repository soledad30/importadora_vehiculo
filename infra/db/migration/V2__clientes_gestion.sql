-- Campos para gestión comercial de clientes (importadora de vehículos)
-- Hibernate ddl-auto=update también aplica cambios; este script sirve para despliegues manuales.

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo VARCHAR(12);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion VARCHAR(200);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ciudad VARCHAR(80);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS notas VARCHAR(500);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_cliente VARCHAR(20);

UPDATE clientes SET tipo_cliente = 'REGULAR' WHERE tipo_cliente IS NULL;
UPDATE clientes SET codigo = 'CLI-' || LPAD(id::text, 3, '0') WHERE codigo IS NULL OR codigo = '';

ALTER TABLE clientes ALTER COLUMN tipo_cliente SET DEFAULT 'REGULAR';

CREATE UNIQUE INDEX IF NOT EXISTS uk_clientes_codigo ON clientes (codigo) WHERE codigo IS NOT NULL;
