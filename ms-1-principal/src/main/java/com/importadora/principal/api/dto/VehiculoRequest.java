package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.EstadoVehiculo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record VehiculoRequest(
        @NotBlank @Size(max = 32) String vin,
        @NotBlank @Size(max = 80) String marca,
        @NotBlank @Size(max = 80) String modelo,
        @NotNull @Min(1900) @Max(2100) Integer anio,
        @NotBlank @Size(max = 40) String color,
        @NotNull @DecimalMin(value = "0.01") BigDecimal precio,
        EstadoVehiculo estado,
        @Size(max = 500) String imagenUrl,
        @Size(max = 80) String paisOrigen,
        Boolean esImportado
) {
}
