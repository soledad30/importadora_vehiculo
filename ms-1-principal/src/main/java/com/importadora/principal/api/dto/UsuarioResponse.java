package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.Usuario;

import java.time.Instant;

public record UsuarioResponse(
        Long id,
        String username,
        String email,
        RolUsuario rol,
        Long clienteId,
        String clienteNombre,
        boolean activo,
        Instant creadoEn,
        Instant actualizadoEn
) {
    public static UsuarioResponse from(Usuario u) {
        String clienteNombre = null;
        Long clienteId = null;
        if (u.getCliente() != null) {
            clienteId = u.getCliente().getId();
            clienteNombre = u.getCliente().getNombres() + " " + u.getCliente().getApellidos();
        }
        return new UsuarioResponse(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getRol(),
                clienteId,
                clienteNombre,
                u.isActivo(),
                u.getCreadoEn(),
                u.getActualizadoEn()
        );
    }
}
