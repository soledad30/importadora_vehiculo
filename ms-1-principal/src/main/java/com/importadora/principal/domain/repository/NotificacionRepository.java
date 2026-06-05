package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.Notificacion;
import com.importadora.principal.domain.model.RolUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    @Query("""
            SELECT n FROM Notificacion n
            WHERE n.usuarioDestinoId = :usuarioId
               OR (n.usuarioDestinoId IS NULL AND n.rolDestino = :rol)
            ORDER BY n.creadoEn DESC
            """)
    List<Notificacion> findForUsuario(@Param("usuarioId") Long usuarioId, @Param("rol") RolUsuario rol);

    @Query("""
            SELECT COUNT(n) FROM Notificacion n
            WHERE n.leida = false
              AND (n.usuarioDestinoId = :usuarioId OR (n.usuarioDestinoId IS NULL AND n.rolDestino = :rol))
            """)
    long countNoLeidas(@Param("usuarioId") Long usuarioId, @Param("rol") RolUsuario rol);

    boolean existsByTituloAndMensaje(String titulo, String mensaje);
}
