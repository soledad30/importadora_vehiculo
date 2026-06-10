package com.importadora.principal.api.dto;

import java.util.List;

public record FlujoCompletoResponse(Long pedidoId, String codigoPedido, List<PasoFlujoResponse> pasos) {
}
