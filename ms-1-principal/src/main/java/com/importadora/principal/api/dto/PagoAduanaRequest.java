package com.importadora.principal.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PagoAduanaRequest(
        @NotBlank @Size(max = 40) String numeroDua,
        @NotBlank @Size(max = 120) String agenteAduanal,
        @NotBlank @Size(max = 60) String comprobantePagoSunca,
        @Size(max = 40) String referenciaPoliza,
        BigDecimal montoDai,
        BigDecimal montoIsc,
        BigDecimal montoIvaAduana
) {
}
