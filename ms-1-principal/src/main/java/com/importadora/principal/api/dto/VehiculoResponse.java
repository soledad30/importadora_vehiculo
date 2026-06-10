package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.EstadoVehiculo;
import com.importadora.principal.domain.model.Vehiculo;

import java.math.BigDecimal;
import java.time.Instant;

public record VehiculoResponse(
        Long id,
        String vin,
        String marca,
        String modelo,
        Integer anio,
        String color,
        BigDecimal precio,
        EstadoVehiculo estado,
        String imagenUrl,
        Long loteId,
        String loteCodigo,
        String paisOrigen,
        boolean esImportado,
        Instant creadoEn,
        Instant actualizadoEn
) {
    public static VehiculoResponse from(Vehiculo v) {
        return new VehiculoResponse(
                v.getId(),
                v.getVin(),
                v.getMarca(),
                v.getModelo(),
                v.getAnio(),
                v.getColor(),
                v.getPrecio(),
                v.getEstado(),
                v.getImagenUrl(),
                v.getLote() != null ? v.getLote().getId() : null,
                v.getLote() != null ? v.getLote().getCodigo() : null,
                v.getPaisOrigen(),
                v.isEsImportado(),
                v.getCreadoEn(),
                v.getActualizadoEn()
        );
    }
}
