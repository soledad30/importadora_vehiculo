package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.Pedido;

import java.math.BigDecimal;
import java.time.Instant;

public record PedidoResponse(
        Long id,
        String codigo,
        Long clienteId,
        String clienteNombre,
        String clienteNumeroDocumento,
        Long vehiculoId,
        String vehiculoDescripcion,
        String vehiculoTitulo,
        String vehiculoImagenUrl,
        String vehiculoVin,
        Long vendedorId,
        String vendedorUsername,
        EstadoPedido estado,
        BigDecimal precioBase,
        BigDecimal impuestos,
        BigDecimal envio,
        BigDecimal total,
        String notas,
        Instant creadoEn,
        Instant actualizadoEn
) {
    public static PedidoResponse from(Pedido p) {
        var cliente = p.getCliente();
        var vehiculo = p.getVehiculo();
        String clienteNombre = cliente.getNombres() + " " + cliente.getApellidos();
        String vehiculoTitulo = vehiculo.getMarca() + " " + vehiculo.getModelo() + " " + vehiculo.getAnio();
        String vehiculoDescripcion = vehiculoTitulo + " (" + vehiculo.getVin() + ")";
        String vendedorUsername = p.getVendedor() != null ? p.getVendedor().getUsername() : null;
        Long vendedorId = p.getVendedor() != null ? p.getVendedor().getId() : null;
        String codigo = p.getCodigo() != null ? p.getCodigo() : String.format("PED-%03d", p.getId());

        return new PedidoResponse(
                p.getId(),
                codigo,
                cliente.getId(),
                clienteNombre,
                cliente.getNumeroDocumento(),
                vehiculo.getId(),
                vehiculoDescripcion,
                vehiculoTitulo,
                vehiculo.getImagenUrl(),
                vehiculo.getVin(),
                vendedorId,
                vendedorUsername,
                p.getEstado(),
                p.getPrecioBase(),
                p.getImpuestos(),
                p.getEnvio(),
                p.getTotal(),
                p.getNotas(),
                p.getCreadoEn(),
                p.getActualizadoEn()
        );
    }
}
