ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo VARCHAR(12);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS precio_base DECIMAL(14,2);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS impuestos DECIMAL(14,2);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio DECIMAL(14,2);

UPDATE pedidos SET precio_base = total, impuestos = 0, envio = 0 WHERE precio_base IS NULL;
UPDATE pedidos SET codigo = 'PED-' || LPAD(id::text, 3, '0') WHERE codigo IS NULL OR codigo = '';
