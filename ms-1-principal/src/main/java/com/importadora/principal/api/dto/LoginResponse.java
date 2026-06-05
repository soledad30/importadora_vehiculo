package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.RolUsuario;

public record LoginResponse(
        String token,
        String tipo,
        Long expiraEn,
        String username,
        RolUsuario rol,
        Long clienteId,
        String clienteNombre
) {
}
