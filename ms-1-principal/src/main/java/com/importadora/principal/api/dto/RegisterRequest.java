package com.importadora.principal.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 160) String nombreCompleto,
        @NotBlank @Email @Size(max = 120) String email,
        @Size(max = 30) String telefono,
        @NotBlank @Size(max = 30) String cedulaDocumento,
        @NotBlank @Size(min = 6, max = 120) String password,
        @NotBlank @Size(min = 6, max = 120) String confirmPassword
) {
}
