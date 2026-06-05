package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.EstadoImportacion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ImportacionRequest(
        @NotNull Long pedidoId,
        @NotBlank @Size(max = 80) String paisOrigen,
        @NotBlank @Size(max = 80) String aduana,
        @Size(max = 80) String puertoOrigen,
        @Size(max = 80) String puertoDestino,
        @Size(max = 80) String naviera,
        @Size(max = 40) String numeroBl,
        @Size(max = 40) String numeroContenedor,
        @Size(max = 40) String numeroDespacho,
        EstadoImportacion estado,
        LocalDate fechaInicio,
        LocalDate fechaEstimadaEntrega,
        @Size(max = 64) String ms2EmbarqueId
) {
}
