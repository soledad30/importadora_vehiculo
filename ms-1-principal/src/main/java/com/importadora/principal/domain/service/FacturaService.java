package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.FacturaRequest;
import com.importadora.principal.api.dto.FacturaResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.DuplicateResourceException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.EstadoFactura;
import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.Factura;
import com.importadora.principal.domain.model.Pedido;
import com.importadora.principal.domain.model.Vendedor;
import com.importadora.principal.domain.repository.FacturaRepository;
import com.importadora.principal.domain.repository.PedidoRepository;
import com.importadora.principal.domain.repository.VendedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final PedidoRepository pedidoRepository;
    private final VendedorRepository vendedorRepository;

    @Transactional(readOnly = true)
    public List<FacturaResponse> listar() {
        return facturaRepository.findAllWithRelations().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FacturaResponse obtenerPorId(Long id) {
        return facturaRepository.findByIdWithRelations(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: id=" + id));
    }

    @Transactional(readOnly = true)
    public String siguienteNumeroFactura() {
        return generarNumeroFactura();
    }

    @Transactional
    public FacturaResponse crear(FacturaRequest request) {
        if (facturaRepository.existsByPedidoId(request.pedidoId())) {
            throw new DuplicateResourceException("Ya existe factura para el pedido: " + request.pedidoId());
        }

        String numeroFactura = request.numeroFactura();
        if (numeroFactura == null || numeroFactura.isBlank()) {
            numeroFactura = generarNumeroFactura();
        }
        if (facturaRepository.existsByNumeroFactura(numeroFactura)) {
            throw new DuplicateResourceException("Número de factura ya existe: " + numeroFactura);
        }

        Pedido pedido = pedidoRepository.findById(request.pedidoId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: id=" + request.pedidoId()));

        if (pedido.getEstado() == EstadoPedido.PENDIENTE || pedido.getEstado() == EstadoPedido.CANCELADO) {
            throw new BusinessRuleException("No se puede facturar un pedido PENDIENTE o CANCELADO");
        }

        Factura factura = Factura.builder()
                .pedido(pedido)
                .numeroFactura(numeroFactura)
                .monto(request.monto())
                .estado(request.estado() != null ? request.estado() : EstadoFactura.BORRADOR)
                .fechaEmision(request.fechaEmision())
                .build();

        Factura guardada = facturaRepository.save(factura);
        return toResponse(facturaRepository.findByIdWithRelations(guardada.getId()).orElse(guardada));
    }

    @Transactional
    public FacturaResponse emitir(Long id) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: id=" + id));
        if (factura.getEstado() != EstadoFactura.BORRADOR) {
            throw new BusinessRuleException("Solo se pueden emitir facturas en estado BORRADOR");
        }
        factura.setEstado(EstadoFactura.EMITIDA);
        Factura guardada = facturaRepository.save(factura);
        return toResponse(facturaRepository.findByIdWithRelations(guardada.getId()).orElse(guardada));
    }

    @Transactional
    public FacturaResponse marcarPagada(Long id) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: id=" + id));
        if (factura.getEstado() != EstadoFactura.EMITIDA) {
            throw new BusinessRuleException("La factura debe estar EMITIDA para marcarla como pagada");
        }
        factura.setEstado(EstadoFactura.PAGADA);
        Factura guardada = facturaRepository.save(factura);
        return toResponse(facturaRepository.findByIdWithRelations(guardada.getId()).orElse(guardada));
    }

    private String generarNumeroFactura() {
        int year = LocalDate.now().getYear();
        String prefix = "FAC-" + year + "-";
        long secuencia = facturaRepository.countByNumeroFacturaStartingWith(prefix) + 1;
        return prefix + String.format("%04d", secuencia);
    }

    private FacturaResponse toResponse(Factura factura) {
        Vendedor vendedor = null;
        if (factura.getPedido().getVendedor() != null) {
            vendedor = vendedorRepository
                    .findByUsuarioId(factura.getPedido().getVendedor().getId())
                    .orElse(null);
        }
        return FacturaResponse.from(factura, vendedor);
    }
}
