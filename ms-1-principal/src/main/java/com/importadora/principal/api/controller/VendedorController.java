package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.VendedorRequest;
import com.importadora.principal.api.dto.VendedorResumenResponse;
import com.importadora.principal.api.dto.VendedorResponse;
import com.importadora.principal.domain.service.VendedorService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vendedores")
@RequiredArgsConstructor
@Tag(name = "Vendedores", description = "Gestión del equipo de ventas")
public class VendedorController {

    private final VendedorService vendedorService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar vendedores")
    public List<VendedorResponse> listar() {
        return vendedorService.listar();
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Resumen KPIs de vendedores")
    public VendedorResumenResponse resumen() {
        return vendedorService.resumen();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener vendedor por ID")
    public VendedorResponse obtener(@PathVariable Long id) {
        return vendedorService.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Registrar nuevo vendedor")
    public ResponseEntity<VendedorResponse> crear(@Valid @RequestBody VendedorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendedorService.crear(request));
    }

    @PostMapping("/{id}/toggle-activo")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activar o desactivar vendedor")
    public VendedorResponse toggleActivo(@PathVariable Long id) {
        return vendedorService.toggleActivo(id);
    }
}
