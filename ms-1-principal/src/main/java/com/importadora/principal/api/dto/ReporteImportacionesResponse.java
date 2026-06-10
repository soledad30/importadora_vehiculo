package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.EstadoImportacion;

import java.util.List;

public record ReporteImportacionesResponse(
        long totalActivas,
        long totalCompletadas,
        long pedidosConfirmadosSinImportacion,
        long importacionesRetrasadas,
        double promedioDiasEnProceso,
        List<EstadoPipelineItem> pipeline,
        List<ImportacionAlertaItem> alertas
) {
    public record EstadoPipelineItem(
            EstadoImportacion estado,
            String etiqueta,
            long cantidad
    ) {
    }

    public record ImportacionAlertaItem(
            String codigo,
            String vehiculo,
            String cliente,
            EstadoImportacion estado,
            long diasEnProceso,
            String fechaEstimadaEntrega,
            String puertoDestino
    ) {
    }
}
