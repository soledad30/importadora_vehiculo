package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.EstadoImportacion;
import com.importadora.principal.domain.model.Importacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ImportacionRepository extends JpaRepository<Importacion, Long> {

    Optional<Importacion> findByPedidoId(Long pedidoId);

    boolean existsByPedidoId(Long pedidoId);

    @Query("SELECT i FROM Importacion i JOIN FETCH i.pedido p JOIN FETCH p.cliente JOIN FETCH p.vehiculo")
    List<Importacion> findAllWithRelations();

    @Query("SELECT i FROM Importacion i JOIN FETCH i.pedido p JOIN FETCH p.cliente JOIN FETCH p.vehiculo WHERE i.id = :id")
    Optional<Importacion> findByIdWithRelations(Long id);

    long countByEstadoNot(EstadoImportacion estado);
}
