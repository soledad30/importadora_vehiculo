package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.RolUsuario;

public record MiPerfilResponse(
        Long usuarioId,
        String username,
        String email,
        RolUsuario rol,
        ClienteResponse cliente,
        VendedorResponse vendedor
) {
}
