package com.importadora.principal.api.dto;

import java.math.BigDecimal;

public record ImpuestosAduanaResponse(
        Long importacionId,
        String codigo,
        BigDecimal valorCif,
        BigDecimal montoDai,
        BigDecimal montoIsc,
        BigDecimal montoIvaAduana,
        BigDecimal montoTotalImpuestos
) {
}
