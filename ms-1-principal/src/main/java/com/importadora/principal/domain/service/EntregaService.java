package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.ChecklistEntregaResponse;
import com.importadora.principal.api.dto.EntregaCompletaResponse;
import com.importadora.principal.api.dto.EntregaRequest;
import com.importadora.principal.api.dto.PedidoResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.Entrega;
import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.EstadoTraspaso;
import com.importadora.principal.domain.model.EstadoVehiculo;
import com.importadora.principal.domain.model.Pedido;
import com.importadora.principal.domain.model.TipoComprador;
import com.importadora.principal.domain.model.TraspasoPropiedad;
import com.importadora.principal.domain.repository.EntregaRepository;
import com.importadora.principal.domain.repository.PedidoRepository;
import com.importadora.principal.domain.repository.TraspasoPropiedadRepository;
import com.importadora.principal.domain.repository.VehiculoRepository;
import com.importadora.principal.integration.OrquestacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;

@Service
@RequiredArgsConstructor
public class EntregaService {

    private final PedidoRepository pedidoRepository;
    private final EntregaRepository entregaRepository;
    private final TraspasoPropiedadRepository traspasoRepository;
    private final VehiculoRepository vehiculoRepository;
    private final ImportacionService importacionService;
    private final ChecklistEntregaService checklistService;
    private final NotificacionService notificacionService;
    private final OrquestacionService orquestacionService;

    @Transactional(readOnly = true)
    public ChecklistEntregaResponse checklist(Long pedidoId) {
        return checklistService.evaluar(obtenerPedido(pedidoId));
    }

    @Transactional
    public EntregaCompletaResponse entregar(Long pedidoId, EntregaRequest request) {
        Pedido pedido = obtenerPedido(pedidoId);
        if (pedido.getEstado() != EstadoPedido.EN_IMPORTACION) {
            throw new BusinessRuleException("El pedido debe estar en importación para marcar como entregado");
        }
        if (entregaRepository.findByPedidoId(pedidoId).isPresent()) {
            throw new BusinessRuleException("Este pedido ya fue entregado");
        }

        validarTraspaso(request);

        String acta = String.format("ACT-%d-%04d", Year.now().getValue(), pedidoId);
        Entrega entrega = Entrega.builder()
                .pedido(pedido)
                .actaNumero(acta)
                .fechaEntrega(LocalDate.now())
                .lugarEntrega(request.lugarEntrega() != null ? request.lugarEntrega() : "Patio importadora")
                .recibidoPor(request.recibidoPor())
                .tipoDocumentoRecibe(request.tipoDocumentoRecibe())
                .numeroDocumentoRecibe(request.numeroDocumentoRecibe())
                .kilometraje(request.kilometraje())
                .observaciones(request.observaciones())
                .build();
        entregaRepository.save(entrega);

        String titular = request.titularNombre() != null && !request.titularNombre().isBlank()
                ? request.titularNombre()
                : request.recibidoPor();
        String numeroTraspaso = request.numeroTraspaso() != null && !request.numeroTraspaso().isBlank()
                ? request.numeroTraspaso()
                : String.format("TRP-%d-%04d", Year.now().getValue(), pedidoId);

        TraspasoPropiedad traspaso = TraspasoPropiedad.builder()
                .pedido(pedido)
                .tipoComprador(request.tipoComprador())
                .titularNombre(titular)
                .rtn(request.rtn())
                .numeroTraspaso(numeroTraspaso)
                .estado(EstadoTraspaso.EN_TRAMITE)
                .notario(request.notario())
                .fechaTraspaso(LocalDate.now())
                .observaciones("Traspaso iniciado al entregar vehículo")
                .build();
        traspasoRepository.save(traspaso);

        pedido.setEstado(EstadoPedido.ENTREGADO);
        pedido.getVehiculo().setEstado(EstadoVehiculo.VENDIDO);
        vehiculoRepository.save(pedido.getVehiculo());
        importacionService.completarPorPedido(pedidoId);
        Pedido guardado = pedidoRepository.save(pedido);

        notificacionService.pedidoEstado(
                guardado.getCodigo(),
                EstadoPedido.ENTREGADO.name(),
                guardado.getId(),
                guardado.getCliente());
        orquestacionService.despuesDeEntregarPedido(guardado);

        PedidoResponse pedidoResponse = PedidoResponse.from(
                pedidoRepository.findByIdWithRelations(guardado.getId()).orElse(guardado));
        return EntregaCompletaResponse.from(pedidoResponse, entrega, traspaso);
    }

    private void validarTraspaso(EntregaRequest request) {
        if (request.tipoComprador() == TipoComprador.EMPRESA) {
            if (request.rtn() == null || request.rtn().isBlank()) {
                throw new BusinessRuleException("RTN obligatorio para traspaso a empresa");
            }
            if (request.titularNombre() == null || request.titularNombre().isBlank()) {
                throw new BusinessRuleException("Razón social obligatoria para traspaso a empresa");
            }
        }
    }

    private Pedido obtenerPedido(Long id) {
        return pedidoRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado: id=" + id));
    }
}
