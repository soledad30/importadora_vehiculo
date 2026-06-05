package com.importadora.principal.config;

import com.importadora.principal.domain.model.CategoriaNotificacion;
import com.importadora.principal.domain.model.NivelNotificacion;
import com.importadora.principal.domain.model.Notificacion;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class NotificacionInitializer implements CommandLineRunner {

    private final NotificacionRepository notificacionRepository;

    @Override
    public void run(String... args) {
        if (notificacionRepository.count() > 0) {
            return;
        }
        seedAdmin();
        seedVendedor();
        seedCliente();
        log.info("Notificaciones de demostración cargadas");
    }

    private void seedAdmin() {
        crear(RolUsuario.ADMIN, CategoriaNotificacion.STOCK, NivelNotificacion.CRITICO,
                "Alerta crítica de stock",
                "Stock bajo: Toyota RAV4 — solo quedan 2 unidades en inventario",
                "N8N → MS-1 → Inventario");
        crear(RolUsuario.ADMIN, CategoriaNotificacion.IMPORTACION, NivelNotificacion.ADVERTENCIA,
                "Embarque en puerto",
                "Embarque #EMB-2026-034 llegó a Puerto Cortés — 8 vehículos",
                "N8N → MS-2 → Importaciones");
        crear(RolUsuario.ADMIN, CategoriaNotificacion.DOCUMENTO, NivelNotificacion.ADVERTENCIA,
                "Póliza por vencer",
                "Póliza POL-2026-00456 vence en 3 días — Nissan Rogue 2024",
                "N8N → MS-3 → Documentos");
        crear(RolUsuario.ADMIN, CategoriaNotificacion.PREDICCION, NivelNotificacion.INFO,
                "Predicción ML de demanda",
                "MS-2 recomienda importar 5 Toyota Hilux — alta demanda proyectada Q2",
                "N8N → MS-2 → ML");
        crear(RolUsuario.ADMIN, CategoriaNotificacion.BLOCKCHAIN, NivelNotificacion.EXITO,
                "Transacción blockchain confirmada",
                "TX confirmada: VIN 2T3P1RPV5RC123456 — entrega registrada",
                "N8N → MS-3 → Blockchain");
        crear(RolUsuario.ADMIN, CategoriaNotificacion.PROVEEDOR, NivelNotificacion.CRITICO,
                "Subasta proveedor",
                "Copart: subasta lote #45892 finaliza en 2 horas — 3 vehículos marcados",
                "N8N → Proveedores");
    }

    private void seedVendedor() {
        crear(RolUsuario.VENDEDOR, CategoriaNotificacion.CLIENTE, NivelNotificacion.INFO,
                "Cliente sin asignar",
                "Hay clientes nuevos disponibles para tomar en tu cartera",
                "MS-1 → CRM");
        crear(RolUsuario.VENDEDOR, CategoriaNotificacion.PEDIDO, NivelNotificacion.ADVERTENCIA,
                "Pedidos sin vendedor",
                "Revisa pedidos pendientes sin vendedor asignado — puedes tomarlos o cerrarlos",
                "MS-1 → Ventas");
        crear(RolUsuario.VENDEDOR, CategoriaNotificacion.VEHICULO, NivelNotificacion.EXITO,
                "Nuevos vehículos",
                "Se agregaron vehículos al catálogo listos para cotizar",
                "MS-1 → Catálogo");
    }

    private void seedCliente() {
        crear(RolUsuario.CLIENTE, CategoriaNotificacion.VEHICULO, NivelNotificacion.EXITO,
                "Nuevos vehículos disponibles",
                "Hay vehículos nuevos en el catálogo listos para tu compra",
                "MS-1 → Catálogo");
        crear(RolUsuario.CLIENTE, CategoriaNotificacion.PEDIDO, NivelNotificacion.INFO,
                "Seguimiento de compra",
                "Recibirás alertas cuando tu pedido cambie de estado",
                "MS-1 → Mis pedidos");
    }

    private void crear(
            RolUsuario rol,
            CategoriaNotificacion categoria,
            NivelNotificacion nivel,
            String titulo,
            String mensaje,
            String flujo) {
        if (notificacionRepository.existsByTituloAndMensaje(titulo, mensaje)) {
            return;
        }
        notificacionRepository.save(Notificacion.builder()
                .rolDestino(rol)
                .categoria(categoria)
                .nivel(nivel)
                .titulo(titulo)
                .mensaje(mensaje)
                .flujo(flujo)
                .leida(false)
                .build());
    }
}
