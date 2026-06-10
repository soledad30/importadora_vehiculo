package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.CompraOrigen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CompraOrigenRepository extends JpaRepository<CompraOrigen, Long> {

    Optional<CompraOrigen> findByVehiculoId(Long vehiculoId);

    @Query("""
            SELECT c FROM CompraOrigen c
            JOIN FETCH c.vehiculo
            ORDER BY c.fechaCompra DESC
            """)
    List<CompraOrigen> findAllWithVehiculo();
}
