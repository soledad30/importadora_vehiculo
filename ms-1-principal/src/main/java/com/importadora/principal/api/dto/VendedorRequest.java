package com.importadora.principal.api.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VendedorRequest(
        @NotBlank @Size(max = 160) String nombreCompleto,
        @NotBlank @Email @Size(max = 120) String email,
        @NotBlank @Size(max = 30) String telefono,
        @NotBlank @Size(max = 30) String cedula,
        @Size(max = 80) String zonaAsignada,
        LocalDate fechaIngreso,
        @DecimalMin("0") BigDecimal metaMensual,
        @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal comisionPorcentaje,
        @Size(min = 6, max = 120) String password
) {
}
