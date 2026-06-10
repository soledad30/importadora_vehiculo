package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.EstadoLoteImportacion;
import com.importadora.principal.domain.model.LoteImportacion;

import java.time.Instant;
import java.time.LocalDate;

public record LoteImportacionResponse(
        Long id,
        String codigo,
        String numeroContenedor,
        String naviera,
        String puertoOrigen,
        String puertoDestino,
        EstadoLoteImportacion estado,
        LocalDate fechaEmbarque,
        int cantidadVehiculos,
        String ms2EmbarqueId,
        String notas,
        Instant creadoEn,
        Instant actualizadoEn
) {
    public static LoteImportacionResponse from(LoteImportacion lote, int cantidadVehiculos) {
        String codigo = lote.getCodigo() != null ? lote.getCodigo() : String.format("LOT-%03d", lote.getId());
        return new LoteImportacionResponse(
                lote.getId(),
                codigo,
                lote.getNumeroContenedor(),
                lote.getNaviera(),
                lote.getPuertoOrigen(),
                lote.getPuertoDestino(),
                lote.getEstado(),
                lote.getFechaEmbarque(),
                cantidadVehiculos,
                lote.getMs2EmbarqueId(),
                lote.getNotas(),
                lote.getCreadoEn(),
                lote.getActualizadoEn()
        );
    }
}
