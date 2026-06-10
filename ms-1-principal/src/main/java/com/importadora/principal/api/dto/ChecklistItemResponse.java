package com.importadora.principal.api.dto;

public record ChecklistItemResponse(
        String codigo,
        String descripcion,
        boolean completado,
        boolean obligatorio,
        String detalle
) {
}
