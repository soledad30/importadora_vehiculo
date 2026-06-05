package com.importadora.principal.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Asegura columnas de gestión de clientes cuando ddl-auto no las creó
 * (p. ej. tabla existente con datos y campo NOT NULL).
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class ClienteSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo VARCHAR(12)");
            jdbcTemplate.execute("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion VARCHAR(200)");
            jdbcTemplate.execute("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ciudad VARCHAR(80)");
            jdbcTemplate.execute("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS notas VARCHAR(500)");
            jdbcTemplate.execute("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_cliente VARCHAR(20)");
            jdbcTemplate.execute("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS vendedor_asignado_id BIGINT");
            jdbcTemplate.update(
                    "UPDATE clientes SET tipo_cliente = 'REGULAR' WHERE tipo_cliente IS NULL");
            jdbcTemplate.update(
                    "UPDATE clientes SET codigo = 'CLI-' || LPAD(id::text, 3, '0') "
                            + "WHERE codigo IS NULL OR codigo = ''");
            jdbcTemplate.execute(
                    "ALTER TABLE clientes ALTER COLUMN tipo_cliente SET DEFAULT 'REGULAR'");
            jdbcTemplate.execute(
                    "ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(500)");
            jdbcTemplate.execute("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo VARCHAR(12)");
            jdbcTemplate.execute(
                    "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS precio_base DECIMAL(14,2)");
            jdbcTemplate.execute("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS impuestos DECIMAL(14,2)");
            jdbcTemplate.execute("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio DECIMAL(14,2)");
            jdbcTemplate.update(
                    "UPDATE pedidos SET precio_base = total, impuestos = 0, envio = 0 "
                            + "WHERE precio_base IS NULL");
            jdbcTemplate.update(
                    "UPDATE pedidos SET codigo = 'PED-' || LPAD(id::text, 3, '0') "
                            + "WHERE codigo IS NULL OR codigo = ''");
            jdbcTemplate.update(
                    "UPDATE vendedores SET codigo = 'VEN-' || LPAD(id::text, 3, '0') "
                            + "WHERE codigo IS NULL OR codigo = ''");
            jdbcTemplate.execute("ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS pais_origen VARCHAR(80)");
            jdbcTemplate.execute(
                    "ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS es_importado BOOLEAN DEFAULT TRUE");
            jdbcTemplate.update("UPDATE vehiculos SET es_importado = TRUE WHERE es_importado IS NULL");
            jdbcTemplate.execute("ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS codigo VARCHAR(16)");
            jdbcTemplate.execute("ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS puerto_origen VARCHAR(80)");
            jdbcTemplate.execute("ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS puerto_destino VARCHAR(80)");
            jdbcTemplate.execute("ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS naviera VARCHAR(80)");
            jdbcTemplate.execute("ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS numero_bl VARCHAR(40)");
            jdbcTemplate.execute("ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS numero_contenedor VARCHAR(40)");
            jdbcTemplate.execute("ALTER TABLE importaciones ADD COLUMN IF NOT EXISTS ms2_embarque_id VARCHAR(64)");
            jdbcTemplate.update(
                    "UPDATE importaciones SET codigo = 'IMP-' || LPAD(id::text, 3, '0') "
                            + "WHERE codigo IS NULL OR codigo = ''");
            log.debug("Esquema verificado (clientes, vehiculos, pedidos, vendedores, importaciones)");
        } catch (Exception ex) {
            log.error("No se pudo migrar esquema: {}", ex.getMessage());
            throw ex;
        }
    }
}
