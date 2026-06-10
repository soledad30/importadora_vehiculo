package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.Entrega;
import com.importadora.principal.domain.model.EstadoTraspaso;
import com.importadora.principal.domain.model.TipoComprador;
import com.importadora.principal.domain.model.TraspasoPropiedad;

import java.time.LocalDate;

public record EntregaCompletaResponse(
        PedidoResponse pedido,
        String actaNumero,
        LocalDate fechaEntrega,
        String lugarEntrega,
        String recibidoPor,
        TipoComprador tipoComprador,
        String titularNombre,
        String rtn,
        String numeroTraspaso,
        EstadoTraspaso estadoTraspaso,
        String notario
) {
    public static EntregaCompletaResponse from(
            PedidoResponse pedido,
            Entrega entrega,
            TraspasoPropiedad traspaso) {
        return new EntregaCompletaResponse(
                pedido,
                entrega.getActaNumero(),
                entrega.getFechaEntrega(),
                entrega.getLugarEntrega(),
                entrega.getRecibidoPor(),
                traspaso.getTipoComprador(),
                traspaso.getTitularNombre(),
                traspaso.getRtn(),
                traspaso.getNumeroTraspaso(),
                traspaso.getEstado(),
                traspaso.getNotario()
        );
    }
}
