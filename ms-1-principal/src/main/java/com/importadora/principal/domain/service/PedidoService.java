package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.ImportacionIniciarRequest;
import com.importadora.principal.api.dto.PedidoRequest;
import com.importadora.principal.api.dto.PedidoResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.Cliente;
import com.importadora.principal.domain.model.RolUsuario;
import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.EstadoVehiculo;
import com.importadora.principal.domain.model.Pedido;
import com.importadora.principal.domain.model.Usuario;
import com.importadora.principal.domain.model.Vehiculo;
import com.importadora.principal.domain.repository.ClienteRepository;
import com.importadora.principal.domain.repository.PedidoRepository;
import com.importadora.principal.domain.repository.UsuarioRepository;
import com.importadora.principal.domain.repository.VehiculoRepository;
import com.importadora.principal.security.SecurityActor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private static final BigDecimal TASA_IMPUESTO_IMPORTACION = new BigDecimal("0.15");
    private static final BigDecimal ENVIO_DEFAULT = new BigDecimal("1500.00");

    private static final EnumSet<EstadoPedido> ESTADOS_ACTIVOS = EnumSet.of(
            EstadoPedido.PENDIENTE,
            EstadoPedido.CONFIRMADO,
            EstadoPedido.EN_IMPORTACION
    );

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final VehiculoRepository vehiculoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ImportacionService importacionService;
    private final SecurityActor securityActor;
    private final NotificacionService notificacionService;

    @Transactional(readOnly = true)
    public List<PedidoResponse> listar() {
        RolUsuario rol = securityActor.rolActual();
        var actor = securityActor.usuarioActual();

        List<Pedido> pedidos = switch (rol) {
            case ADMIN -> pedidoRepository.findAllWithRelations();
            case VENDEDOR -> pedidoRepository.findByVendedorOrSinAsignarWithRelations(actor.getId());
            default -> List.of();
        };

        return pedidos.stream()
                .map(this::asegurarCodigoSiFalta)
                .map(PedidoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listarPorCliente(Long clienteId) {
        securityActor.validarClientePropio(clienteId);
        if (!clienteRepository.existsById(clienteId)) {
            throw new ResourceNotFoundException("Cliente no encontrado: id=" + clienteId);
        }
        return pedidoRepository.findByClienteIdWithRelations(clienteId).stream()
                .map(this::asegurarCodigoSiFalta)
                .map(PedidoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PedidoResponse obtenerPorId(Long id) {
        Pedido pedido = pedidoRepository.findByIdWithRelations(id)
                .map(this::asegurarCodigoSiFalta)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: id=" + id));
        securityActor.validarClientePropio(pedido.getCliente().getId());
        return PedidoResponse.from(pedido);
    }

    @Transactional
    public PedidoResponse crear(PedidoRequest request) {
        RolUsuario rol = securityActor.rolActual();
        var actor = securityActor.usuarioActual();

        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: id=" + request.clienteId()));

        if (!cliente.isActivo()) {
            throw new BusinessRuleException("El cliente está inactivo");
        }

        Vehiculo vehiculo = vehiculoRepository.findById(request.vehiculoId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado: id=" + request.vehiculoId()));

        if (vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE) {
            throw new BusinessRuleException("El vehículo no está disponible para venta");
        }

        if (pedidoRepository.existsByVehiculoIdAndEstadoIn(vehiculo.getId(), ESTADOS_ACTIVOS)) {
            throw new BusinessRuleException("El vehículo ya tiene un pedido activo");
        }

        Usuario vendedor = null;
        if (rol == RolUsuario.VENDEDOR) {
            vendedor = actor;
        } else if (request.vendedorId() != null) {
            vendedor = usuarioRepository.findById(request.vendedorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado: id=" + request.vendedorId()));
        }

        DesgloseFinanciero desglose = calcularDesglose(vehiculo.getPrecio(), request.impuestos(), request.envio());

        Pedido pedido = Pedido.builder()
                .cliente(cliente)
                .vehiculo(vehiculo)
                .vendedor(vendedor)
                .precioBase(desglose.precioBase())
                .impuestos(desglose.impuestos())
                .envio(desglose.envio())
                .total(desglose.total())
                .notas(request.notas())
                .estado(EstadoPedido.PENDIENTE)
                .build();

        vehiculo.setEstado(EstadoVehiculo.RESERVADO);
        vehiculoRepository.save(vehiculo);

        Pedido guardado = pedidoRepository.save(pedido);
        guardado.setCodigo(formatoCodigo(guardado.getId()));
        guardado = pedidoRepository.save(guardado);

        String codigo = guardado.getCodigo();
        if (vendedor == null) {
            notificacionService.pedidoSinVendedor(codigo, cliente.nombreCompleto(), guardado.getId());
        }
        notificacionService.pedidoCreado(codigo, cliente.nombreCompleto(), guardado.getId(), cliente);

        return PedidoResponse.from(pedidoRepository.findByIdWithRelations(guardado.getId()).orElse(guardado));
    }

    @Transactional
    public PedidoResponse tomar(Long id) {
        if (securityActor.rolActual() != RolUsuario.VENDEDOR) {
            throw new BusinessRuleException("Solo un vendedor puede tomar pedidos");
        }
        Pedido pedido = obtenerPedido(id);
        if (pedido.getVendedor() != null) {
            return PedidoResponse.from(pedido);
        }
        pedido.setVendedor(securityActor.usuarioActual());
        return guardarYResponder(pedido);
    }

    @Transactional
    public PedidoResponse cerrar(Long id, String motivo) {
        RolUsuario rol = securityActor.rolActual();
        if (rol != RolUsuario.ADMIN && rol != RolUsuario.VENDEDOR) {
            throw new BusinessRuleException("No tiene permiso para cerrar pedidos");
        }
        Pedido pedido = obtenerPedido(id);
        if (rol == RolUsuario.VENDEDOR && pedido.getVendedor() != null
                && !pedido.getVendedor().getId().equals(securityActor.usuarioActual().getId())) {
            throw new BusinessRuleException("No puede cerrar pedidos de otro vendedor");
        }
        if (pedido.getEstado() == EstadoPedido.ENTREGADO || pedido.getEstado() == EstadoPedido.CANCELADO) {
            throw new BusinessRuleException("No se puede cerrar el pedido en su estado actual");
        }
        pedido.setEstado(EstadoPedido.CANCELADO);
        String m = motivo == null ? "" : motivo.trim();
        if (!m.isBlank()) {
            String prev = pedido.getNotas();
            pedido.setNotas((prev == null || prev.isBlank()) ? ("Cierre: " + m) : (prev + "\nCierre: " + m));
        }
        pedido.getVehiculo().setEstado(EstadoVehiculo.DISPONIBLE);
        vehiculoRepository.save(pedido.getVehiculo());
        PedidoResponse resp = guardarYResponder(pedido);
        notificacionService.pedidoCancelado(pedido.getCodigo(), m, pedido.getId(), pedido.getCliente());
        return resp;
    }

    @Transactional
    public PedidoResponse confirmar(Long id) {
        Pedido pedido = obtenerPedido(id);
        if (pedido.getEstado() != EstadoPedido.PENDIENTE) {
            throw new BusinessRuleException("Solo se pueden aprobar pedidos pendientes");
        }
        pedido.setEstado(EstadoPedido.CONFIRMADO);
        PedidoResponse resp = guardarYResponder(pedido);
        notificarEstado(pedido, "Confirmado");
        return resp;
    }

    @Transactional
    public PedidoResponse iniciarImportacion(Long id, ImportacionIniciarRequest request) {
        importacionService.iniciarImportacion(id, request);
        Pedido pedido = obtenerPedido(id);
        notificarEstado(pedido, "En importación / aduana");
        return obtenerPorId(id);
    }

    @Transactional
    public PedidoResponse entregar(Long id) {
        Pedido pedido = obtenerPedido(id);
        if (pedido.getEstado() != EstadoPedido.EN_IMPORTACION) {
            throw new BusinessRuleException("El pedido debe estar en importación para marcar como completado");
        }
        pedido.setEstado(EstadoPedido.ENTREGADO);
        pedido.getVehiculo().setEstado(EstadoVehiculo.VENDIDO);
        vehiculoRepository.save(pedido.getVehiculo());
        importacionService.completarPorPedido(id);
        PedidoResponse resp = guardarYResponder(pedido);
        notificarEstado(pedido, "Entregado");
        return resp;
    }

    @Transactional
    public PedidoResponse cancelar(Long id) {
        Pedido pedido = obtenerPedido(id);
        if (pedido.getEstado() == EstadoPedido.ENTREGADO || pedido.getEstado() == EstadoPedido.CANCELADO) {
            throw new BusinessRuleException("No se puede cancelar el pedido en su estado actual");
        }
        pedido.setEstado(EstadoPedido.CANCELADO);
        pedido.getVehiculo().setEstado(EstadoVehiculo.DISPONIBLE);
        vehiculoRepository.save(pedido.getVehiculo());
        PedidoResponse resp = guardarYResponder(pedido);
        notificacionService.pedidoCancelado(pedido.getCodigo(), null, pedido.getId(), pedido.getCliente());
        return resp;
    }

    private void notificarEstado(Pedido pedido, String estadoLabel) {
        notificacionService.pedidoEstado(
                pedido.getCodigo() != null ? pedido.getCodigo() : formatoCodigo(pedido.getId()),
                estadoLabel,
                pedido.getId(),
                pedido.getCliente());
    }

    private Pedido asegurarCodigoSiFalta(Pedido p) {
        boolean actualizar = false;
        if (p.getCodigo() == null || p.getCodigo().isBlank()) {
            p.setCodigo(formatoCodigo(p.getId()));
            actualizar = true;
        }
        if (p.getPrecioBase() == null) {
            p.setPrecioBase(p.getTotal());
            p.setImpuestos(BigDecimal.ZERO);
            p.setEnvio(BigDecimal.ZERO);
            actualizar = true;
        }
        return actualizar ? pedidoRepository.save(p) : p;
    }

    private DesgloseFinanciero calcularDesglose(BigDecimal precioVehiculo, BigDecimal impuestosReq, BigDecimal envioReq) {
        BigDecimal precioBase = precioVehiculo.setScale(2, RoundingMode.HALF_UP);
        BigDecimal impuestos = impuestosReq != null
                ? impuestosReq.setScale(2, RoundingMode.HALF_UP)
                : precioBase.multiply(TASA_IMPUESTO_IMPORTACION).setScale(2, RoundingMode.HALF_UP);
        BigDecimal envio = envioReq != null
                ? envioReq.setScale(2, RoundingMode.HALF_UP)
                : ENVIO_DEFAULT;
        BigDecimal total = precioBase.add(impuestos).add(envio);
        return new DesgloseFinanciero(precioBase, impuestos, envio, total);
    }

    private String formatoCodigo(Long id) {
        return String.format("PED-%03d", id);
    }

    private Pedido obtenerPedido(Long id) {
        return pedidoRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: id=" + id));
    }

    private PedidoResponse guardarYResponder(Pedido pedido) {
        Pedido guardado = pedidoRepository.save(pedido);
        return PedidoResponse.from(pedidoRepository.findByIdWithRelations(guardado.getId()).orElse(guardado));
    }

    private record DesgloseFinanciero(BigDecimal precioBase, BigDecimal impuestos, BigDecimal envio, BigDecimal total) {
    }
}
