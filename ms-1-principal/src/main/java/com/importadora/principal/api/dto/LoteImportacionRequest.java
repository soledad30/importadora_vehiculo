package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.EstadoLoteImportacion;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record LoteImportacionRequest(
        @Size(max = 40) String numeroContenedor,
        @Size(max = 80) String naviera,
        @Size(max = 80) String puertoOrigen,
        @Size(max = 80) String puertoDestino,
        EstadoLoteImportacion estado,
        LocalDate fechaEmbarque,
        @Size(max = 500) String notas
) {
}
