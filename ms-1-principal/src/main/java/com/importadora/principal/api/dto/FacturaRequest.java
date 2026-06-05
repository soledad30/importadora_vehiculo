package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.EstadoFactura;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FacturaRequest(
        @NotNull Long pedidoId,
        @Size(max = 30) String numeroFactura,
        @NotNull @DecimalMin(value = "0.01") BigDecimal monto,
        EstadoFactura estado,
        LocalDate fechaEmision
) {
}
