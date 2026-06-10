package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.TraspasoPropiedad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TraspasoPropiedadRepository extends JpaRepository<TraspasoPropiedad, Long> {

    Optional<TraspasoPropiedad> findByPedidoId(Long pedidoId);
}
