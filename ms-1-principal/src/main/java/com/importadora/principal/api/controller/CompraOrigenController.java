package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.CompraOrigenRequest;
import com.importadora.principal.api.dto.CompraOrigenResponse;
import com.importadora.principal.domain.service.CompraOrigenService;
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
@RequestMapping("/api/v1/compras-origen")
@RequiredArgsConstructor
@Tag(name = "Compras en origen", description = "Adquisición en subasta/dealer (USA)")
public class CompraOrigenController {

    private final CompraOrigenService compraOrigenService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Listar compras en origen")
    public List<CompraOrigenResponse> listar() {
        return compraOrigenService.listar();
    }

    @GetMapping("/vehiculo/{vehiculoId}")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Obtener compra por vehículo")
    public CompraOrigenResponse porVehiculo(@PathVariable Long vehiculoId) {
        return compraOrigenService.obtenerPorVehiculo(vehiculoId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Registrar compra en origen")
    public ResponseEntity<CompraOrigenResponse> registrar(@Valid @RequestBody CompraOrigenRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(compraOrigenService.registrar(request));
    }
}
