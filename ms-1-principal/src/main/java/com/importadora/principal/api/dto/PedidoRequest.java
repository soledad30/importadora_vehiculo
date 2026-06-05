package com.importadora.principal.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PedidoRequest(
        @NotNull Long clienteId,
        @NotNull Long vehiculoId,
        Long vendedorId,
        @Size(max = 500) String notas,
        @DecimalMin(value = "0") BigDecimal impuestos,
        @DecimalMin(value = "0") BigDecimal envio
) {
}
