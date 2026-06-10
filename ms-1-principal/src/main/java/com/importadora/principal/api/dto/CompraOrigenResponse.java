package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.CompraOrigen;
import com.importadora.principal.domain.model.TipoProveedorCompra;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record CompraOrigenResponse(
        Long id,
        Long vehiculoId,
        String vehiculoVin,
        String vehiculoTitulo,
        String proveedor,
        TipoProveedorCompra tipoProveedor,
        String loteSubasta,
        BigDecimal precioFob,
        LocalDate fechaCompra,
        String paisOrigen,
        String referenciaDocumento,
        String notas,
        Instant creadoEn
) {
    public static CompraOrigenResponse from(CompraOrigen c) {
        var v = c.getVehiculo();
        return new CompraOrigenResponse(
                c.getId(),
                v.getId(),
                v.getVin(),
                v.getMarca() + " " + v.getModelo() + " " + v.getAnio(),
                c.getProveedor(),
                c.getTipoProveedor(),
                c.getLoteSubasta(),
                c.getPrecioFob(),
                c.getFechaCompra(),
                c.getPaisOrigen(),
                c.getReferenciaDocumento(),
                c.getNotas(),
                c.getCreadoEn()
        );
    }
}
