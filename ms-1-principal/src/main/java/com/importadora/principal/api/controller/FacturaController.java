package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.FacturaRequest;
import com.importadora.principal.api.dto.FacturaResponse;
import com.importadora.principal.domain.service.FacturaService;
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
@RequestMapping("/api/v1/facturas")
@RequiredArgsConstructor
@Tag(name = "Facturas", description = "Facturación de pedidos")
public class FacturaController {

    private final FacturaService facturaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Listar facturas")
    public List<FacturaResponse> listar() {
        return facturaService.listar();
    }

    @GetMapping("/siguiente-numero")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Obtener el siguiente número de factura disponible")
    public String siguienteNumero() {
        return facturaService.siguienteNumeroFactura();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Obtener factura por ID")
    public FacturaResponse obtener(@PathVariable Long id) {
        return facturaService.obtenerPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Crear factura")
    public ResponseEntity<FacturaResponse> crear(@Valid @RequestBody FacturaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facturaService.crear(request));
    }

    @PostMapping("/{id}/emitir")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Emitir factura")
    public FacturaResponse emitir(@PathVariable Long id) {
        return facturaService.emitir(id);
    }

    @PostMapping("/{id}/pagar")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Marcar factura como pagada")
    public FacturaResponse marcarPagada(@PathVariable Long id) {
        return facturaService.marcarPagada(id);
    }
}
