package com.importadora.principal.api.controller;

import com.importadora.principal.api.dto.ImportacionIniciarRequest;
import com.importadora.principal.api.dto.PedidoCerrarRequest;
import com.importadora.principal.api.dto.PedidoRequest;
import com.importadora.principal.api.dto.PedidoResponse;
import com.importadora.principal.domain.service.PedidoService;
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
@RequestMapping("/api/v1/pedidos")
@RequiredArgsConstructor
@Tag(name = "Pedidos", description = "Órdenes de compra / venta")
public class PedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Listar pedidos")
    public List<PedidoResponse> listar() {
        return pedidoService.listar();
    }

    @GetMapping("/cliente/{clienteId}")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','CLIENTE')")
    @Operation(summary = "Listar pedidos por cliente")
    public List<PedidoResponse> listarPorCliente(@PathVariable Long clienteId) {
        return pedidoService.listarPorCliente(clienteId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR','CLIENTE')")
    @Operation(summary = "Obtener pedido por ID")
    public PedidoResponse obtener(@PathVariable Long id) {
        return pedidoService.obtenerPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Crear pedido")
    public ResponseEntity<PedidoResponse> crear(@Valid @RequestBody PedidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.crear(request));
    }

    @PostMapping("/{id}/confirmar")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Confirmar pedido")
    public PedidoResponse confirmar(@PathVariable Long id) {
        return pedidoService.confirmar(id);
    }

    @PostMapping("/{id}/importacion")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Iniciar importación (crea registro aduanero y sincroniza estados)")
    public PedidoResponse iniciarImportacion(
            @PathVariable Long id,
            @RequestBody(required = false) ImportacionIniciarRequest request) {
        return pedidoService.iniciarImportacion(id, request);
    }

    @PostMapping("/{id}/entregar")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Marcar pedido como entregado")
    public PedidoResponse entregar(@PathVariable Long id) {
        return pedidoService.entregar(id);
    }

    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Cancelar pedido")
    public PedidoResponse cancelar(@PathVariable Long id) {
        return pedidoService.cancelar(id);
    }

    @PostMapping("/{id}/tomar")
    @PreAuthorize("hasAnyRole('VENDEDOR')")
    @Operation(summary = "Tomar (asignar) un pedido sin vendedor")
    public PedidoResponse tomar(@PathVariable Long id) {
        return pedidoService.tomar(id);
    }

    @PostMapping("/{id}/cerrar")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    @Operation(summary = "Cerrar pedido con motivo (cancela)")
    public PedidoResponse cerrar(@PathVariable Long id, @Valid @RequestBody PedidoCerrarRequest request) {
        return pedidoService.cerrar(id, request.motivo());
    }
}
