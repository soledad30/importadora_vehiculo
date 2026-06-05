package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotBlank @Size(min = 3, max = 60) String username,
        @NotBlank @Size(min = 6, max = 120) String password,
        @NotBlank @Email @Size(max = 120) String email,
        @NotNull RolUsuario rol,
        Long clienteId
) {
}
