package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.CategoriaNotificacion;
import com.importadora.principal.domain.model.NivelNotificacion;
import com.importadora.principal.domain.model.Notificacion;

import java.time.Instant;

public record NotificacionResponse(
        Long id,
        CategoriaNotificacion categoria,
        NivelNotificacion nivel,
        String titulo,
        String mensaje,
        String referenciaTipo,
        Long referenciaId,
        String flujo,
        boolean leida,
        Instant creadoEn
) {
    public static NotificacionResponse from(Notificacion n) {
        return new NotificacionResponse(
                n.getId(),
                n.getCategoria(),
                n.getNivel(),
                n.getTitulo(),
                n.getMensaje(),
                n.getReferenciaTipo(),
                n.getReferenciaId(),
                n.getFlujo(),
                n.isLeida(),
                n.getCreadoEn()
        );
    }
}
