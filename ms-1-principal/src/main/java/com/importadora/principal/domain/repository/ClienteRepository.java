package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByNumeroDocumento(String numeroDocumento);

    boolean existsByNumeroDocumento(String numeroDocumento);

    boolean existsByEmail(String email);

    long countByActivoTrue();

    @Query("""
            SELECT c FROM Cliente c
            LEFT JOIN FETCH c.vendedorAsignado va
            WHERE va IS NULL OR va.id = :usuarioId
            """)
    List<Cliente> findCarteraOrSinAsignar(@Param("usuarioId") Long usuarioId);

    @Query("SELECT c FROM Cliente c LEFT JOIN FETCH c.vendedorAsignado")
    List<Cliente> findAllWithVendedorAsignado();
}
