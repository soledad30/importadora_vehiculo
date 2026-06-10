package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.ReporteFinanzasResponse;
import com.importadora.principal.api.dto.ReporteFinanzasResponse.FacturaPendienteItem;
import com.importadora.principal.api.dto.ReporteImportacionesResponse;
import com.importadora.principal.api.dto.ReporteImportacionesResponse.EstadoPipelineItem;
import com.importadora.principal.api.dto.ReporteImportacionesResponse.ImportacionAlertaItem;
import com.importadora.principal.api.dto.ReporteResumenResponse;
import com.importadora.principal.api.dto.ReporteResumenResponse.VendedorRankingItem;
import com.importadora.principal.api.dto.VendedorResponse;
import com.importadora.principal.domain.model.EstadoFactura;
import com.importadora.principal.domain.model.EstadoImportacion;
import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.EstadoVehiculo;
import com.importadora.principal.domain.model.Factura;
import com.importadora.principal.domain.model.Importacion;
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
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private static final Map<EstadoImportacion, String> ETIQUETAS_IMPORTACION = Map.of(
            EstadoImportacion.SOLICITADA, "Solicitada",
            EstadoImportacion.EN_TRANSITO, "En tránsito",
            EstadoImportacion.EN_ADUANA, "En aduana",
            EstadoImportacion.LIBERADA, "Liberada",
            EstadoImportacion.COMPLETADA, "Completada"
    );

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

    @Transactional(readOnly = true)
    public ReporteImportacionesResponse reporteImportaciones() {
        List<Importacion> importaciones = importacionRepository.findAllWithRelations();
        LocalDate hoy = LocalDate.now(ZoneId.systemDefault());

        List<Importacion> activas = importaciones.stream()
                .filter(i -> i.getEstado() != EstadoImportacion.COMPLETADA)
                .toList();

        double promedioDias = activas.stream()
                .mapToLong(i -> ChronoUnit.DAYS.between(i.getFechaInicio(), hoy))
                .average()
                .orElse(0.0);

        long retrasadas = activas.stream()
                .filter(i -> i.getFechaEstimadaEntrega() != null
                        && i.getFechaEstimadaEntrega().isBefore(hoy))
                .count();

        List<EstadoPipelineItem> pipeline = List.of(
                pipelineItem(EstadoImportacion.SOLICITADA),
                pipelineItem(EstadoImportacion.EN_TRANSITO),
                pipelineItem(EstadoImportacion.EN_ADUANA),
                pipelineItem(EstadoImportacion.LIBERADA),
                pipelineItem(EstadoImportacion.COMPLETADA)
        );

        List<ImportacionAlertaItem> alertas = activas.stream()
                .filter(i -> i.getFechaEstimadaEntrega() != null
                        && i.getFechaEstimadaEntrega().isBefore(hoy))
                .sorted(Comparator.comparing(Importacion::getFechaEstimadaEntrega))
                .limit(8)
                .map(i -> new ImportacionAlertaItem(
                        i.getCodigo(),
                        vehiculoLabel(i),
                        i.getPedido().getCliente().nombreCompleto(),
                        i.getEstado(),
                        ChronoUnit.DAYS.between(i.getFechaInicio(), hoy),
                        i.getFechaEstimadaEntrega() != null ? i.getFechaEstimadaEntrega().toString() : "",
                        i.getPuertoDestino() != null ? i.getPuertoDestino() : i.getAduana()
                ))
                .toList();

        return new ReporteImportacionesResponse(
                activas.size(),
                importacionRepository.countByEstado(EstadoImportacion.COMPLETADA),
                pedidoRepository.countByEstadoAndSinImportacion(EstadoPedido.CONFIRMADO),
                retrasadas,
                Math.round(promedioDias * 10.0) / 10.0,
                pipeline,
                alertas
        );
    }

    @Transactional(readOnly = true)
    public ReporteFinanzasResponse reporteFinanzas() {
        BigDecimal montoPorCobrar = facturaRepository.sumMontoByEstado(EstadoFactura.EMITIDA);
        BigDecimal montoCobrado = facturaRepository.sumMontoByEstado(EstadoFactura.PAGADA);
        BigDecimal montoTotal = montoPorCobrar.add(montoCobrado);

        LocalDate hoy = LocalDate.now(ZoneId.systemDefault());
        List<FacturaPendienteItem> pendientes = facturaRepository.findAllWithRelations().stream()
                .filter(f -> f.getEstado() == EstadoFactura.EMITIDA)
                .sorted(Comparator.comparing(Factura::getFechaEmision))
                .limit(10)
                .map(f -> new FacturaPendienteItem(
                        f.getNumeroFactura(),
                        f.getPedido().getCliente().nombreCompleto(),
                        vehiculoLabel(f.getPedido().getVehiculo().getMarca(),
                                f.getPedido().getVehiculo().getModelo(),
                                f.getPedido().getVehiculo().getAnio()),
                        f.getMonto(),
                        f.getFechaEmision().toString(),
                        ChronoUnit.DAYS.between(f.getFechaEmision(), hoy)
                ))
                .toList();

        return new ReporteFinanzasResponse(
                facturaRepository.countByEstado(EstadoFactura.EMITIDA),
                facturaRepository.countByEstado(EstadoFactura.PAGADA),
                facturaRepository.countByEstado(EstadoFactura.BORRADOR),
                facturaRepository.countByEstado(EstadoFactura.ANULADA),
                montoPorCobrar,
                montoCobrado,
                montoTotal,
                pendientes
        );
    }

    private EstadoPipelineItem pipelineItem(EstadoImportacion estado) {
        return new EstadoPipelineItem(
                estado,
                ETIQUETAS_IMPORTACION.getOrDefault(estado, estado.name()),
                importacionRepository.countByEstado(estado)
        );
    }

    private String vehiculoLabel(Importacion importacion) {
        var v = importacion.getPedido().getVehiculo();
        return vehiculoLabel(v.getMarca(), v.getModelo(), v.getAnio());
    }

    private String vehiculoLabel(String marca, String modelo, Integer anio) {
        return String.format("%s %s %d", marca, modelo, anio);
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
