package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.ReporteFinanzasResponse;
import com.importadora.principal.api.dto.ReporteImportacionesResponse;
import com.importadora.principal.api.dto.ReporteResumenResponse;
import com.importadora.principal.domain.service.ReporteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reportes")
@RequiredArgsConstructor
@Tag(name = "Reportes", description = "Resumen y métricas del negocio")
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Resumen general de reportes")
    public ReporteResumenResponse resumen() {
        return reporteService.resumen();
    }

    @GetMapping("/mi-resumen")
    @PreAuthorize("hasRole('VENDEDOR')")
    @Operation(summary = "Resumen de reportes del vendedor logueado")
    public ReporteResumenResponse miResumen() {
        return reporteService.resumenPropioVendedor();
    }

    @GetMapping("/importaciones")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Pipeline y alertas de importaciones")
    public ReporteImportacionesResponse importaciones() {
        return reporteService.reporteImportaciones();
    }

    @GetMapping("/finanzas")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Facturación y cuentas por cobrar")
    public ReporteFinanzasResponse finanzas() {
        return reporteService.reporteFinanzas();
    }
}
