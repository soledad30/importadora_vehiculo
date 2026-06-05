package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.TipoCliente;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
        @NotBlank @Size(max = 160) String nombreCompleto,
        @NotBlank @Email @Size(max = 120) String email,
        @Size(max = 30) String telefono,
        @NotBlank @Size(max = 30) String cedulaRuc,
        @Size(max = 200) String direccion,
        @Size(max = 80) String ciudad,
        @NotNull TipoCliente tipoCliente,
        @Size(max = 500) String notas
) {
}
