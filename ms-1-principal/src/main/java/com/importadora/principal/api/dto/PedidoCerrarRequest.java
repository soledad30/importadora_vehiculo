package com.importadora.principal.api.dto;

import jakarta.validation.constraints.NotBlank;

public record PedidoCerrarRequest(
        @NotBlank(message = "El motivo es obligatorio")
        String motivo
) {
}

