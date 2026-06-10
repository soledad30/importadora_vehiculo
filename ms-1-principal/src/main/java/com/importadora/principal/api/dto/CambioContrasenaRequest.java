package com.importadora.principal.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambioContrasenaRequest(
        @NotBlank String contrasenaActual,
        @NotBlank @Size(min = 6, max = 120) String contrasenaNueva
) {
}
