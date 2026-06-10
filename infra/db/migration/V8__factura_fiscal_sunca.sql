-- Factura fiscal (CAI, RTN, ISV) y trámite aduanero SUNCA

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS subtotal DECIMAL(14,2);
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS isv DECIMAL(14,2);
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS cai VARCHAR(50);
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS rtn_emisor VARCHAR(20);
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS rtn_cliente VARCHAR(20);
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(20);

ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS numero_dua VARCHAR(40);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS agente_aduanal VARCHAR(120);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS monto_dai DECIMAL(14,2);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS monto_isc DECIMAL(14,2);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS monto_iva_aduana DECIMAL(14,2);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS monto_total_impuestos DECIMAL(14,2);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS estado_pago_aduana VARCHAR(20) DEFAULT 'PENDIENTE';
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS comprobante_pago_sunca VARCHAR(60);
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS fecha_pago_aduana DATE;
ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS referencia_poliza VARCHAR(40);

UPDATE importaciones SET estado_pago_aduana = 'PENDIENTE'
WHERE estado_pago_aduana IS NULL;
