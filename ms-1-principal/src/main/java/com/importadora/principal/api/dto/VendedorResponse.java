package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.Vendedor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record VendedorResponse(
        Long id,
        String codigo,
        Long usuarioId,
        String nombreCompleto,
        String telefono,
        String email,
        String cedula,
        String zonaAsignada,
        LocalDate fechaIngreso,
        BigDecimal metaMensual,
        BigDecimal comisionPorcentaje,
        BigDecimal ventasTotales,
        boolean activo,
        boolean enCampo,
        Instant creadoEn
) {
    public static VendedorResponse from(Vendedor v, BigDecimal ventasTotales) {
        return new VendedorResponse(
                v.getId(),
                v.getCodigo() != null ? v.getCodigo() : String.format("VEN-%03d", v.getId()),
                v.getUsuario().getId(),
                v.getNombreCompleto(),
                v.getTelefono(),
                v.getEmail(),
                v.getCedula(),
                v.getZonaAsignada(),
                v.getFechaIngreso(),
                v.getMetaMensual(),
                v.getComisionPorcentaje(),
                ventasTotales,
                v.getUsuario().isActivo(),
                v.isEnCampo(),
                v.getCreadoEn()
        );
    }
}
