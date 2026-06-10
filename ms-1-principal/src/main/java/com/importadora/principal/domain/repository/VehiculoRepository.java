package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.EstadoVehiculo;
import com.importadora.principal.domain.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    Optional<Vehiculo> findByVin(String vin);

    boolean existsByVin(String vin);

    long countByEstado(EstadoVehiculo estado);

    long countByLoteId(Long loteId);
}
