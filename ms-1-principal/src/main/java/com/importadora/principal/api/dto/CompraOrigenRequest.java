package com.importadora.principal.api.dto;

import com.importadora.principal.domain.model.TipoProveedorCompra;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CompraOrigenRequest(
        @NotNull Long vehiculoId,
        @NotBlank @Size(max = 120) String proveedor,
        @NotNull TipoProveedorCompra tipoProveedor,
        @Size(max = 80) String loteSubasta,
        @NotNull @DecimalMin("0.01") BigDecimal precioFob,
        LocalDate fechaCompra,
        @Size(max = 80) String paisOrigen,
        @Size(max = 80) String referenciaDocumento,
        @Size(max = 500) String notas
) {
}
