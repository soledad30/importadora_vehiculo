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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacturaService {

    private static final BigDecimal TASA_ISV = new BigDecimal("0.15");
    private static final String CAI_DEMO = "A1B2C3D4-E5F6-7890-ABCD-EF1234567890";
    private static final String RTN_EMISOR_DEMO = "0801-1990-123456";

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

        BigDecimal subtotal = request.subtotal();
        BigDecimal isv = request.isv();
        BigDecimal monto = request.monto();
        if (subtotal == null && isv == null) {
            subtotal = monto.divide(BigDecimal.ONE.add(TASA_ISV), 2, RoundingMode.HALF_UP);
            isv = monto.subtract(subtotal);
        } else if (subtotal != null && isv == null) {
            isv = subtotal.multiply(TASA_ISV).setScale(2, RoundingMode.HALF_UP);
            monto = subtotal.add(isv);
        } else if (subtotal == null && isv != null) {
            subtotal = monto.subtract(isv);
        }

        String cai = orDefault(request.cai(), CAI_DEMO);
        String rtnEmisor = orDefault(request.rtnEmisor(), RTN_EMISOR_DEMO);
        String rtnCliente = request.rtnCliente();
        if (rtnCliente == null || rtnCliente.isBlank()) {
            rtnCliente = pedido.getCliente().getNumeroDocumento();
        }

        Factura factura = Factura.builder()
                .pedido(pedido)
                .numeroFactura(numeroFactura)
                .monto(monto)
                .subtotal(subtotal)
                .isv(isv)
                .cai(cai)
                .rtnEmisor(rtnEmisor)
                .rtnCliente(rtnCliente)
                .metodoPago(request.metodoPago())
                .estado(request.estado() != null ? request.estado() : EstadoFactura.BORRADOR)
                .fechaEmision(request.fechaEmision())
                .build();

        Factura guardada = facturaRepository.save(factura);
        return toResponse(facturaRepository.findByIdWithRelations(guardada.getId()).orElse(guardada));
    }

    @Transactional
    public FacturaResponse emitir(Long id) {
        Factura factura = facturaRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: id=" + id));
        if (factura.getEstado() != EstadoFactura.BORRADOR) {
            throw new BusinessRuleException("Solo se pueden emitir facturas en estado BORRADOR");
        }
        completarDatosFiscalesSiFaltan(factura);
        validarDatosFiscales(factura);
        if (factura.getFechaEmision() == null) {
            factura.setFechaEmision(LocalDate.now());
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

    private void completarDatosFiscalesSiFaltan(Factura factura) {
        if (factura.getCai() == null || factura.getCai().isBlank()) {
            factura.setCai(CAI_DEMO);
        }
        if (factura.getRtnEmisor() == null || factura.getRtnEmisor().isBlank()) {
            factura.setRtnEmisor(RTN_EMISOR_DEMO);
        }
        if (factura.getRtnCliente() == null || factura.getRtnCliente().isBlank()) {
            factura.setRtnCliente(factura.getPedido().getCliente().getNumeroDocumento());
        }
        if (factura.getSubtotal() == null || factura.getIsv() == null) {
            BigDecimal monto = factura.getMonto();
            BigDecimal subtotal = monto.divide(BigDecimal.ONE.add(TASA_ISV), 2, RoundingMode.HALF_UP);
            factura.setSubtotal(subtotal);
            factura.setIsv(monto.subtract(subtotal));
        }
    }

    private void validarDatosFiscales(Factura factura) {
        if (factura.getCai() == null || factura.getCai().isBlank()) {
            throw new BusinessRuleException("CAI obligatorio para emitir factura fiscal");
        }
        if (factura.getRtnEmisor() == null || factura.getRtnEmisor().isBlank()) {
            throw new BusinessRuleException("RTN del emisor obligatorio para factura fiscal");
        }
        if (factura.getSubtotal() == null || factura.getIsv() == null) {
            throw new BusinessRuleException("Subtotal e ISV obligatorios para factura fiscal");
        }
    }

    private String orDefault(String value, String defaultValue) {
        return value != null && !value.isBlank() ? value : defaultValue;
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
