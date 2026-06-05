package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.ReporteResumenResponse;
import com.importadora.principal.api.dto.ReporteResumenResponse.VendedorRankingItem;
import com.importadora.principal.api.dto.VendedorResponse;
import com.importadora.principal.domain.model.EstadoFactura;
import com.importadora.principal.domain.model.EstadoImportacion;
import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.EstadoVehiculo;
import com.importadora.principal.domain.model.Vendedor;
import com.importadora.principal.domain.repository.ClienteRepository;
import com.importadora.principal.domain.repository.FacturaRepository;
import com.importadora.principal.domain.repository.ImportacionRepository;
import com.importadora.principal.domain.repository.PedidoRepository;
import com.importadora.principal.domain.repository.VehiculoRepository;
import com.importadora.principal.domain.repository.VendedorRepository;
import com.importadora.principal.security.SecurityActor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final PedidoRepository pedidoRepository;
    private final VehiculoRepository vehiculoRepository;
    private final ClienteRepository clienteRepository;
    private final ImportacionRepository importacionRepository;
    private final FacturaRepository facturaRepository;
    private final VendedorRepository vendedorRepository;
    private final SecurityActor securityActor;

    @Transactional(readOnly = true)
    public ReporteResumenResponse resumen() {
        BigDecimal ventasTotales = pedidoRepository.sumTotalByEstado(EstadoPedido.ENTREGADO);
        BigDecimal ventasMes = calcularVentasMesActual();
        List<VendedorRankingItem> topVendedores = topVendedores();

        return new ReporteResumenResponse(
                ventasTotales,
                ventasMes,
                pedidoRepository.countByEstado(EstadoPedido.PENDIENTE),
                pedidoRepository.countByEstado(EstadoPedido.CONFIRMADO)
                        + pedidoRepository.countByEstado(EstadoPedido.EN_IMPORTACION),
                pedidoRepository.countByEstado(EstadoPedido.ENTREGADO),
                vehiculoRepository.countByEstado(EstadoVehiculo.DISPONIBLE),
                vehiculoRepository.countByEstado(EstadoVehiculo.VENDIDO),
                clienteRepository.countByActivoTrue(),
                importacionRepository.countByEstadoNot(EstadoImportacion.COMPLETADA),
                facturaRepository.countByEstado(EstadoFactura.EMITIDA)
                        + facturaRepository.countByEstado(EstadoFactura.PAGADA),
                topVendedores
        );
    }

    @Transactional(readOnly = true)
    public ReporteResumenResponse resumenPropioVendedor() {
        var actor = securityActor.usuarioActual();
        Long usuarioId = actor.getId();

        BigDecimal ventasTotales = pedidoRepository.sumTotalByVendedorUsuarioIdAndEstado(usuarioId, EstadoPedido.ENTREGADO);
        BigDecimal ventasMes = calcularVentasMesActualVendedor(usuarioId);

        long pendientes = pedidoRepository.countByVendedorUsuarioIdAndEstado(usuarioId, EstadoPedido.PENDIENTE);
        long enProceso = pedidoRepository.countByVendedorUsuarioIdAndEstado(usuarioId, EstadoPedido.CONFIRMADO)
                + pedidoRepository.countByVendedorUsuarioIdAndEstado(usuarioId, EstadoPedido.EN_IMPORTACION);
        long completados = pedidoRepository.countByVendedorUsuarioIdAndEstado(usuarioId, EstadoPedido.ENTREGADO);

        return new ReporteResumenResponse(
                ventasTotales,
                ventasMes,
                pendientes,
                enProceso,
                completados,
                vehiculoRepository.countByEstado(EstadoVehiculo.DISPONIBLE),
                vehiculoRepository.countByEstado(EstadoVehiculo.VENDIDO),
                clienteRepository.countByActivoTrue(),
                importacionRepository.countByEstadoNot(EstadoImportacion.COMPLETADA),
                facturaRepository.countByEstado(EstadoFactura.EMITIDA)
                        + facturaRepository.countByEstado(EstadoFactura.PAGADA),
                List.of()
        );
    }

    private List<VendedorRankingItem> topVendedores() {
        return vendedorRepository.findAllWithUsuario().stream()
                .map(v -> VendedorResponse.from(v, ventasTotales(v)))
                .sorted(Comparator.comparing(VendedorResponse::ventasTotales).reversed())
                .limit(5)
                .map(v -> new VendedorRankingItem(
                        v.codigo(), v.nombreCompleto(), v.ventasTotales(), v.comisionPorcentaje()))
                .toList();
    }

    private BigDecimal ventasTotales(Vendedor v) {
        return pedidoRepository.sumTotalByVendedorUsuarioIdAndEstado(
                v.getUsuario().getId(), EstadoPedido.ENTREGADO);
    }

    private BigDecimal calcularVentasMesActual() {
        YearMonth mes = YearMonth.now(ZoneId.systemDefault());
        Instant inicio = mes.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant fin = mes.plusMonths(1).atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        return pedidoRepository.sumTotalByEstadoAndCreadoEnBetween(
                EstadoPedido.ENTREGADO, inicio, fin);
    }

    private BigDecimal calcularVentasMesActualVendedor(Long usuarioId) {
        YearMonth mes = YearMonth.now(ZoneId.systemDefault());
        Instant inicio = mes.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant fin = mes.plusMonths(1).atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        return pedidoRepository.sumTotalByVendedorUsuarioIdAndEstadoAndCreadoEnBetween(
                usuarioId, EstadoPedido.ENTREGADO, inicio, fin);
    }
}
