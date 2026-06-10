package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.LoteImportacionRequest;
import com.importadora.principal.api.dto.LoteImportacionResponse;
import com.importadora.principal.domain.service.LoteImportacionService;
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
@RequestMapping("/api/v1/lotes")
@RequiredArgsConstructor
@Tag(name = "Lotes de importación", description = "Contenedores y lotes de vehículos")
public class LoteImportacionController {

    private final LoteImportacionService loteService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Listar lotes de importación")
    public List<LoteImportacionResponse> listar() {
        return loteService.listar();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Obtener lote por ID")
    public LoteImportacionResponse obtener(@PathVariable Long id) {
        return loteService.obtenerPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear lote de importación")
    public ResponseEntity<LoteImportacionResponse> crear(@Valid @RequestBody LoteImportacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(loteService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar lote")
    public LoteImportacionResponse actualizar(@PathVariable Long id, @Valid @RequestBody LoteImportacionRequest request) {
        return loteService.actualizar(id, request);
    }

    @PostMapping("/{id}/avanzar")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Avanzar estado del lote")
    public LoteImportacionResponse avanzar(@PathVariable Long id) {
        return loteService.avanzarEstado(id);
    }

    @PostMapping("/{id}/vehiculos/{vehiculoId}")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Asignar vehículo al lote")
    public LoteImportacionResponse asignarVehiculo(@PathVariable Long id, @PathVariable Long vehiculoId) {
        return loteService.asignarVehiculo(id, vehiculoId);
    }
}
