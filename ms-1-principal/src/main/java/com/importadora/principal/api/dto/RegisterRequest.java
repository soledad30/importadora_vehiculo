package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 160) String nombreCompleto,
        @NotBlank @Email @Size(max = 120) String email,
        @Size(max = 20) String telefono,
        @NotNull RolUsuario rol,
        @NotBlank @Size(min = 6, max = 120) String password,
        @NotBlank @Size(min = 6, max = 120) String confirmPassword
) {
}
