package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.EstadoPedido;
import com.importadora.principal.domain.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByClienteId(Long clienteId);

    @Query("SELECT p FROM Pedido p JOIN FETCH p.cliente JOIN FETCH p.vehiculo LEFT JOIN FETCH p.vendedor WHERE p.cliente.id = :clienteId")
    List<Pedido> findByClienteIdWithRelations(Long clienteId);

    boolean existsByVehiculoIdAndEstadoIn(Long vehiculoId, Collection<EstadoPedido> estados);

    @Query("SELECT p FROM Pedido p JOIN FETCH p.cliente JOIN FETCH p.vehiculo LEFT JOIN FETCH p.vendedor")
    List<Pedido> findAllWithRelations();

    @Query("""
            SELECT p FROM Pedido p
            JOIN FETCH p.cliente
            JOIN FETCH p.vehiculo
            LEFT JOIN FETCH p.vendedor v
            WHERE v IS NULL OR v.id = :usuarioId
            """)
    List<Pedido> findByVendedorOrSinAsignarWithRelations(@Param("usuarioId") Long usuarioId);

    @Query("SELECT p FROM Pedido p JOIN FETCH p.cliente JOIN FETCH p.vehiculo LEFT JOIN FETCH p.vendedor WHERE p.id = :id")
    Optional<Pedido> findByIdWithRelations(Long id);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.vendedor.id = :usuarioId AND p.estado = :estado")
    BigDecimal sumTotalByVendedorUsuarioIdAndEstado(
            @Param("usuarioId") Long usuarioId,
            @Param("estado") EstadoPedido estado);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.estado = :estado")
    BigDecimal sumTotalByEstado(@Param("estado") EstadoPedido estado);

    long countByEstado(EstadoPedido estado);

    @Query("""
            SELECT COALESCE(SUM(p.total), 0) FROM Pedido p
            WHERE p.estado = :estado AND p.creadoEn >= :inicio AND p.creadoEn < :fin""")
    BigDecimal sumTotalByEstadoAndCreadoEnBetween(
            @Param("estado") EstadoPedido estado,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin);

    @Query("""
            SELECT COALESCE(SUM(p.total), 0) FROM Pedido p
            WHERE p.vendedor.id = :usuarioId AND p.estado = :estado AND p.creadoEn >= :inicio AND p.creadoEn < :fin""")
    BigDecimal sumTotalByVendedorUsuarioIdAndEstadoAndCreadoEnBetween(
            @Param("usuarioId") Long usuarioId,
            @Param("estado") EstadoPedido estado,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin);

    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.vendedor.id = :usuarioId AND p.estado = :estado")
    long countByVendedorUsuarioIdAndEstado(@Param("usuarioId") Long usuarioId, @Param("estado") EstadoPedido estado);
}
