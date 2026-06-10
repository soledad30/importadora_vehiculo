package com.importadora.principal.api.dto;

import java.util.List;

public record ChecklistEntregaResponse(
        Long pedidoId,
        String pedidoCodigo,
        String vehiculoVin,
        boolean listoParaEntregar,
        List<ChecklistItemResponse> items
) {
}
