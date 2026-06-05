package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.cliente WHERE u.username = :username")
    Optional<Usuario> findByUsernameWithCliente(@Param("username") String username);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.cliente WHERE LOWER(u.email) = LOWER(:email)")
    Optional<Usuario> findByEmailIgnoreCaseWithCliente(@Param("email") String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    java.util.Optional<Usuario> findByEmailIgnoreCase(String email);

    Optional<Usuario> findByClienteId(Long clienteId);
}
