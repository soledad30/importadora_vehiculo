package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.TipoCliente;

import java.time.Instant;

public record ClienteResponse(
        Long id,
        String codigo,
        String tipoDocumento,
        String numeroDocumento,
        String nombres,
        String apellidos,
        String nombreCompleto,
        String email,
        String telefono,
        String direccion,
        String ciudad,
        String notas,
        TipoCliente tipoCliente,
        boolean activo,
        Long vendedorAsignadoId,
        String vendedorAsignadoUsername,
        Instant creadoEn,
        Instant actualizadoEn
) {
    public static ClienteResponse from(Cliente c) {
        var vendedor = c.getVendedorAsignado();
        return new ClienteResponse(
                c.getId(),
                c.getCodigo() != null ? c.getCodigo() : formatoCodigo(c.getId()),
                c.getTipoDocumento(),
                c.getNumeroDocumento(),
                c.getNombres(),
                c.getApellidos(),
                c.nombreCompleto(),
                c.getEmail(),
                c.getTelefono(),
                c.getDireccion(),
                c.getCiudad(),
                c.getNotas(),
                c.getTipoCliente(),
                c.isActivo(),
                vendedor != null ? vendedor.getId() : null,
                vendedor != null ? vendedor.getUsername() : null,
                c.getCreadoEn(),
                c.getActualizadoEn()
        );
    }

    private static String formatoCodigo(Long id) {
        return id == null ? null : String.format("CLI-%03d", id);
    }
}
