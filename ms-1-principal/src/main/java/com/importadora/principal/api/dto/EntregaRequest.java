package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.TipoComprador;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EntregaRequest(
        @NotBlank @Size(max = 120) String recibidoPor,
        @Size(max = 120) String lugarEntrega,
        @Size(max = 24) String tipoDocumentoRecibe,
        @Size(max = 40) String numeroDocumentoRecibe,
        Integer kilometraje,
        @Size(max = 500) String observaciones,
        @NotNull TipoComprador tipoComprador,
        @Size(max = 160) String titularNombre,
        @Size(max = 20) String rtn,
        @Size(max = 120) String notario,
        @Size(max = 40) String numeroTraspaso
) {
}
