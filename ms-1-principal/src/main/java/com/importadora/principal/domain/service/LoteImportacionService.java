package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.LoteImportacionRequest;
import com.importadora.principal.api.dto.LoteImportacionResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.EstadoLoteImportacion;
import com.importadora.principal.domain.model.LoteImportacion;
import com.importadora.principal.domain.model.Vehiculo;
import com.importadora.principal.domain.repository.LoteImportacionRepository;
import com.importadora.principal.domain.repository.VehiculoRepository;
import com.importadora.principal.integration.LoteMs2SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LoteImportacionService {

    private final LoteImportacionRepository loteRepository;
    private final VehiculoRepository vehiculoRepository;
    private final LoteMs2SyncService loteMs2SyncService;

    @Transactional(readOnly = true)
    public List<LoteImportacionResponse> listar() {
        return loteRepository.findAllOrdered().stream()
                .map(l -> LoteImportacionResponse.from(l, (int) vehiculoRepository.countByLoteId(l.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public LoteImportacionResponse obtenerPorId(Long id) {
        LoteImportacion lote = loteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lote no encontrado: id=" + id));
        return LoteImportacionResponse.from(lote, (int) vehiculoRepository.countByLoteId(id));
    }

    @Transactional
    public LoteImportacionResponse crear(LoteImportacionRequest request) {
        LoteImportacion lote = LoteImportacion.builder()
                .numeroContenedor(request.numeroContenedor())
                .naviera(request.naviera())
                .puertoOrigen(request.puertoOrigen())
                .puertoDestino(request.puertoDestino())
                .estado(request.estado() != null ? request.estado() : EstadoLoteImportacion.PLANIFICADO)
                .fechaEmbarque(request.fechaEmbarque())
                .notas(request.notas())
                .build();
        LoteImportacion guardado = loteRepository.save(lote);
        guardado.setCodigo(String.format("LOT-%03d", guardado.getId()));
        guardado = loteRepository.save(guardado);
        loteMs2SyncService.sincronizar(guardado);
        return LoteImportacionResponse.from(guardado, 0);
    }

    @Transactional
    public LoteImportacionResponse actualizar(Long id, LoteImportacionRequest request) {
        LoteImportacion lote = loteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lote no encontrado: id=" + id));
        if (request.numeroContenedor() != null) lote.setNumeroContenedor(request.numeroContenedor());
        if (request.naviera() != null) lote.setNaviera(request.naviera());
        if (request.puertoOrigen() != null) lote.setPuertoOrigen(request.puertoOrigen());
        if (request.puertoDestino() != null) lote.setPuertoDestino(request.puertoDestino());
        if (request.estado() != null) lote.setEstado(request.estado());
        if (request.fechaEmbarque() != null) lote.setFechaEmbarque(request.fechaEmbarque());
        if (request.notas() != null) lote.setNotas(request.notas());
        LoteImportacion guardado = loteRepository.save(lote);
        return LoteImportacionResponse.from(guardado, (int) vehiculoRepository.countByLoteId(id));
    }

    @Transactional
    public LoteImportacionResponse asignarVehiculo(Long loteId, Long vehiculoId) {
        LoteImportacion lote = loteRepository.findById(loteId)
                .orElseThrow(() -> new ResourceNotFoundException("Lote no encontrado: id=" + loteId));
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado: id=" + vehiculoId));
        if (vehiculo.getLote() != null && !vehiculo.getLote().getId().equals(loteId)) {
            throw new BusinessRuleException("El vehículo ya pertenece a otro lote");
        }
        vehiculo.setLote(lote);
        vehiculoRepository.save(vehiculo);
        loteMs2SyncService.sincronizar(lote);
        return LoteImportacionResponse.from(lote, (int) vehiculoRepository.countByLoteId(loteId));
    }

    @Transactional
    public LoteImportacionResponse avanzarEstado(Long id) {
        LoteImportacion lote = loteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lote no encontrado: id=" + id));
        EstadoLoteImportacion siguiente = switch (lote.getEstado()) {
            case PLANIFICADO -> EstadoLoteImportacion.EMBARCADO;
            case EMBARCADO -> EstadoLoteImportacion.EN_TRANSITO;
            case EN_TRANSITO -> EstadoLoteImportacion.EN_ADUANA;
            case EN_ADUANA -> EstadoLoteImportacion.LIBERADO;
            case LIBERADO -> EstadoLoteImportacion.EN_PATIO;
            case EN_PATIO -> EstadoLoteImportacion.EN_PATIO;
        };
        lote.setEstado(siguiente);
        LoteImportacion guardado = loteRepository.save(lote);
        loteMs2SyncService.sincronizar(guardado);
        return LoteImportacionResponse.from(guardado, (int) vehiculoRepository.countByLoteId(id));
    }
}
