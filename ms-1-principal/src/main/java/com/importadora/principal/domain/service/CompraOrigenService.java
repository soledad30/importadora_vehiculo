package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.CompraOrigenRequest;
import com.importadora.principal.api.dto.CompraOrigenResponse;
import com.importadora.principal.api.exception.BusinessRuleException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.CompraOrigen;
import com.importadora.principal.domain.model.Vehiculo;
import com.importadora.principal.domain.repository.CompraOrigenRepository;
import com.importadora.principal.domain.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompraOrigenService {

    private final CompraOrigenRepository compraRepository;
    private final VehiculoRepository vehiculoRepository;

    @Transactional(readOnly = true)
    public List<CompraOrigenResponse> listar() {
        return compraRepository.findAllWithVehiculo().stream()
                .map(CompraOrigenResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompraOrigenResponse obtenerPorVehiculo(Long vehiculoId) {
        return compraRepository.findByVehiculoId(vehiculoId)
                .map(CompraOrigenResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Compra origen no encontrada para vehículo id=" + vehiculoId));
    }

    @Transactional
    public CompraOrigenResponse registrar(CompraOrigenRequest request) {
        if (compraRepository.findByVehiculoId(request.vehiculoId()).isPresent()) {
            throw new BusinessRuleException("El vehículo ya tiene registro de compra en origen");
        }
        Vehiculo vehiculo = vehiculoRepository.findById(request.vehiculoId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado: id=" + request.vehiculoId()));

        CompraOrigen compra = CompraOrigen.builder()
                .vehiculo(vehiculo)
                .proveedor(request.proveedor())
                .tipoProveedor(request.tipoProveedor())
                .loteSubasta(request.loteSubasta())
                .precioFob(request.precioFob())
                .fechaCompra(request.fechaCompra())
                .paisOrigen(request.paisOrigen() != null ? request.paisOrigen() : vehiculo.getPaisOrigen())
                .referenciaDocumento(request.referenciaDocumento())
                .notas(request.notas())
                .build();
        if (compra.getPaisOrigen() == null) {
            compra.setPaisOrigen("Estados Unidos");
        }
        CompraOrigen guardada = compraRepository.save(compra);
        return CompraOrigenResponse.from(guardada);
    }
}
