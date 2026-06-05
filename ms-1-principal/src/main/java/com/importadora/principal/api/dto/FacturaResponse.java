package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.EstadoFactura;
import com.importadora.principal.domain.model.Factura;
import com.importadora.principal.domain.model.Pedido;
import com.importadora.principal.domain.model.Vehiculo;
import com.importadora.principal.domain.model.Vendedor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record FacturaResponse(
        Long id,
        Long pedidoId,
        String pedidoCodigo,
        String numeroFactura,
        BigDecimal monto,
        EstadoFactura estado,
        LocalDate fechaEmision,
        Long clienteId,
        String clienteNombre,
        String clienteDocumento,
        String clienteEmail,
        String clienteTelefono,
        String clienteDireccion,
        String clienteCiudad,
        String vendedorNombre,
        String vendedorCodigo,
        String vendedorTelefono,
        String vendedorEmail,
        String vehiculoTitulo,
        String vehiculoVin,
        String vehiculoMarca,
        String vehiculoModelo,
        Integer vehiculoAnio,
        String vehiculoColor,
        String vehiculoPaisOrigen,
        BigDecimal precioBase,
        BigDecimal impuestos,
        BigDecimal envio,
        BigDecimal total,
        Instant creadoEn,
        Instant actualizadoEn
) {
    public static FacturaResponse from(Factura f, Vendedor vendedor) {
        Pedido pedido = f.getPedido();
        Cliente cliente = pedido.getCliente();
        Vehiculo vehiculo = pedido.getVehiculo();
        String pedidoCodigo = pedido.getCodigo() != null
                ? pedido.getCodigo()
                : String.format("PED-%03d", pedido.getId());
        String vehiculoTitulo = vehiculo.getMarca() + " " + vehiculo.getModelo() + " " + vehiculo.getAnio();

        String vendedorNombre = null;
        String vendedorCodigo = null;
        String vendedorTelefono = null;
        String vendedorEmail = null;
        if (vendedor != null) {
            vendedorNombre = vendedor.getNombreCompleto();
            vendedorCodigo = vendedor.getCodigo();
            vendedorTelefono = vendedor.getTelefono();
            vendedorEmail = vendedor.getEmail();
        } else if (pedido.getVendedor() != null) {
            vendedorNombre = pedido.getVendedor().getUsername();
        }

        return new FacturaResponse(
                f.getId(),
                pedido.getId(),
                pedidoCodigo,
                f.getNumeroFactura(),
                f.getMonto(),
                f.getEstado(),
                f.getFechaEmision(),
                cliente.getId(),
                cliente.nombreCompleto(),
                cliente.getTipoDocumento() + " " + cliente.getNumeroDocumento(),
                cliente.getEmail(),
                cliente.getTelefono(),
                cliente.getDireccion(),
                cliente.getCiudad(),
                vendedorNombre,
                vendedorCodigo,
                vendedorTelefono,
                vendedorEmail,
                vehiculoTitulo,
                vehiculo.getVin(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getAnio(),
                vehiculo.getColor(),
                vehiculo.getPaisOrigen(),
                pedido.getPrecioBase(),
                pedido.getImpuestos(),
                pedido.getEnvio(),
                pedido.getTotal(),
                f.getCreadoEn(),
                f.getActualizadoEn()
        );
    }
}
