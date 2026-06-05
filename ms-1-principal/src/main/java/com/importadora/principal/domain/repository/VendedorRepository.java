package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.Vendedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VendedorRepository extends JpaRepository<Vendedor, Long> {

    boolean existsByCedula(String cedula);

    boolean existsByEmailIgnoreCase(String email);

    Optional<Vendedor> findByUsuarioId(Long usuarioId);

    @Query("SELECT v FROM Vendedor v JOIN FETCH v.usuario ORDER BY v.nombreCompleto")
    List<Vendedor> findAllWithUsuario();

    @Query("SELECT v FROM Vendedor v JOIN FETCH v.usuario WHERE v.id = :id")
    Optional<Vendedor> findByIdWithUsuario(Long id);

    long countByEnCampoTrue();

    long countByUsuario_ActivoTrue();
}
