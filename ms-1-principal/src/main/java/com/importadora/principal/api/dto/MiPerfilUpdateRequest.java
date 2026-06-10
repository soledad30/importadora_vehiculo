package com.importadora.principal.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record MiPerfilUpdateRequest(
        @Size(max = 160) String nombreCompleto,
        @Email @Size(max = 120) String email,
        @Size(max = 30) String telefono,
        @Size(max = 200) String direccion,
        @Size(max = 80) String ciudad,
        @Size(max = 80) String zonaAsignada
) {
}
