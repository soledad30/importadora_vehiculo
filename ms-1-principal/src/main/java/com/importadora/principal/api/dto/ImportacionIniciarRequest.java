package com.importadora.principal.api.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Datos logísticos opcionales al iniciar importación desde un pedido confirmado. */
public record ImportacionIniciarRequest(
        @Size(max = 80) String paisOrigen,
        @Size(max = 80) String aduana,
        @Size(max = 80) String puertoOrigen,
        @Size(max = 80) String puertoDestino,
        @Size(max = 80) String naviera,
        @Size(max = 40) String numeroBl,
        @Size(max = 40) String numeroContenedor,
        @Size(max = 40) String numeroDespacho,
        LocalDate fechaEstimadaEntrega,
        @Size(max = 64) String ms2EmbarqueId
) {
}
