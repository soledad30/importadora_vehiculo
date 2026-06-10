package com.importadora.principal.domain.repository;

import com.importadora.principal.domain.model.LoteImportacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface LoteImportacionRepository extends JpaRepository<LoteImportacion, Long> {

    Optional<LoteImportacion> findByCodigo(String codigo);

    @Query("SELECT l FROM LoteImportacion l ORDER BY l.creadoEn DESC")
    List<LoteImportacion> findAllOrdered();
}
