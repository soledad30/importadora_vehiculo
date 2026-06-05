-- Logística aduanera e identificación de vehículos importados (MS-1)
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS pais_origen VARCHAR(80);
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS es_importado BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS codigo VARCHAR(16) UNIQUE;
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS puerto_origen VARCHAR(80);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS puerto_destino VARCHAR(80);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS naviera VARCHAR(80);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS numero_bl VARCHAR(40);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS numero_contenedor VARCHAR(40);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS ms2_embarque_id VARCHAR(64);

UPDATE importaciones SET codigo = 'IMP-' || LPAD(id::text, 3, '0')
WHERE codigo IS NULL OR codigo = '';

UPDATE vehiculos SET es_importado = TRUE WHERE es_importado IS NULL;
