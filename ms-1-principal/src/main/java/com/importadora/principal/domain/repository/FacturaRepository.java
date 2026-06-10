package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.EstadoFactura;
import com.importadora.principal.domain.model.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FacturaRepository extends JpaRepository<Factura, Long> {

    Optional<Factura> findByPedidoId(Long pedidoId);

    boolean existsByPedidoId(Long pedidoId);

    boolean existsByNumeroFactura(String numeroFactura);

    @Query("""
            SELECT f FROM Factura f
            JOIN FETCH f.pedido p
            JOIN FETCH p.cliente
            JOIN FETCH p.vehiculo
            LEFT JOIN FETCH p.vendedor
            """)
    List<Factura> findAllWithRelations();

    @Query("""
            SELECT f FROM Factura f
            JOIN FETCH f.pedido p
            JOIN FETCH p.cliente
            JOIN FETCH p.vehiculo
            LEFT JOIN FETCH p.vendedor
            WHERE f.id = :id
            """)
    Optional<Factura> findByIdWithRelations(Long id);

    long countByEstado(EstadoFactura estado);

    long countByNumeroFacturaStartingWith(String prefix);

    @Query("SELECT COALESCE(SUM(f.monto), 0) FROM Factura f WHERE f.estado = :estado")
    java.math.BigDecimal sumMontoByEstado(@Param("estado") EstadoFactura estado);
}
