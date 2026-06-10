package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.ImpuestosAduanaResponse;
import com.importadora.principal.api.dto.ImportacionRequest;
import com.importadora.principal.api.dto.ImportacionResponse;
import com.importadora.principal.api.dto.PagoAduanaRequest;
import com.importadora.principal.domain.service.ImportacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/importaciones")
@RequiredArgsConstructor
@Tag(name = "Importaciones", description = "Trazabilidad aduanera")
public class ImportacionController {

    private final ImportacionService importacionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Listar importaciones")
    public List<ImportacionResponse> listar() {
        return importacionService.listar();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Obtener importación por ID")
    public ImportacionResponse obtener(@PathVariable Long id) {
        return importacionService.obtenerPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Registrar importación")
    public ResponseEntity<ImportacionResponse> crear(@Valid @RequestBody ImportacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(importacionService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Actualizar importación")
    public ImportacionResponse actualizar(@PathVariable Long id, @Valid @RequestBody ImportacionRequest request) {
        return importacionService.actualizar(id, request);
    }

    @GetMapping("/{id}/impuestos-aduana")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Calcular impuestos aduaneros estimados (DAI, ISC, IVA)")
    public ImpuestosAduanaResponse calcularImpuestos(@PathVariable Long id) {
        return importacionService.calcularImpuestosAduana(id);
    }

    @PostMapping("/{id}/pago-aduana")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Registrar pago aduanero SUNCA")
    public ImportacionResponse registrarPagoAduana(
            @PathVariable Long id,
            @Valid @RequestBody PagoAduanaRequest request) {
        return importacionService.registrarPagoAduana(id, request);
    }
}
