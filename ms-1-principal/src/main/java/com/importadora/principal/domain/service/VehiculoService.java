package com.importadora.principal.domain.service;

import com.importadora.principal.api.dto.VehiculoRequest;
import com.importadora.principal.api.dto.VehiculoResponse;
import com.importadora.principal.api.exception.DuplicateResourceException;
import com.importadora.principal.api.exception.ResourceNotFoundException;
import com.importadora.principal.domain.model.EstadoVehiculo;
import com.importadora.principal.domain.model.Vehiculo;
import com.importadora.principal.domain.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final NotificacionService notificacionService;

    @Transactional(readOnly = true)
    public List<VehiculoResponse> listar() {
        return vehiculoRepository.findAll().stream()
                .map(VehiculoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public VehiculoResponse obtenerPorId(Long id) {
        return vehiculoRepository.findById(id)
                .map(VehiculoResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado: id=" + id));
    }

    @Transactional
    public VehiculoResponse crear(VehiculoRequest request) {
        if (vehiculoRepository.existsByVin(request.vin())) {
            throw new DuplicateResourceException("Ya existe un vehículo con VIN: " + request.vin());
        }
        Vehiculo vehiculo = Vehiculo.builder()
                .vin(request.vin())
                .marca(request.marca())
                .modelo(request.modelo())
                .anio(request.anio())
                .color(request.color())
                .precio(request.precio())
                .estado(request.estado())
                .imagenUrl(normalizarImagenUrl(request.imagenUrl()))
                .paisOrigen(request.paisOrigen())
                .esImportado(request.esImportado() == null || request.esImportado())
                .build();
        Vehiculo guardado = vehiculoRepository.save(vehiculo);
        if (guardado.getEstado() == EstadoVehiculo.DISPONIBLE) {
            notificacionService.nuevoVehiculoDisponible(
                    guardado.getMarca(), guardado.getModelo(), guardado.getAnio(), guardado.getId());
        }
        return VehiculoResponse.from(guardado);
    }

    @Transactional
    public VehiculoResponse actualizar(Long id, VehiculoRequest request) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado: id=" + id));
        EstadoVehiculo estadoAnterior = vehiculo.getEstado();

        vehiculoRepository.findByVin(request.vin())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(v -> {
                    throw new DuplicateResourceException("Ya existe un vehículo con VIN: " + request.vin());
                });

        vehiculo.setVin(request.vin());
        vehiculo.setMarca(request.marca());
        vehiculo.setModelo(request.modelo());
        vehiculo.setAnio(request.anio());
        vehiculo.setColor(request.color());
        vehiculo.setPrecio(request.precio());
        if (request.estado() != null) {
            vehiculo.setEstado(request.estado());
        }
        vehiculo.setImagenUrl(normalizarImagenUrl(request.imagenUrl()));
        if (request.paisOrigen() != null) {
            vehiculo.setPaisOrigen(request.paisOrigen());
        }
        if (request.esImportado() != null) {
            vehiculo.setEsImportado(request.esImportado());
        }
        Vehiculo guardado = vehiculoRepository.save(vehiculo);
        if (guardado.getEstado() == EstadoVehiculo.DISPONIBLE && estadoAnterior != EstadoVehiculo.DISPONIBLE) {
            notificacionService.nuevoVehiculoDisponible(
                    guardado.getMarca(), guardado.getModelo(), guardado.getAnio(), guardado.getId());
        }
        return VehiculoResponse.from(guardado);
    }

    private String normalizarImagenUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        return url.trim();
    }

    @Transactional
    public void eliminar(Long id) {
        if (!vehiculoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vehículo no encontrado: id=" + id);
        }
        vehiculoRepository.deleteById(id);
    }
}
