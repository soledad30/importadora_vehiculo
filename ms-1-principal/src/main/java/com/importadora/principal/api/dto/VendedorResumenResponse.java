package com.importadora.principal.api.dto;

import java.math.BigDecimal;

public record VendedorResumenResponse(
        long totalVendedores,
        long activos,
        long enCampo,
        BigDecimal ventasEquipo
) {
}
