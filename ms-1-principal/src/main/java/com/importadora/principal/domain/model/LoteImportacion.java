package com.importadora.principal.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "lotes_importacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoteImportacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 16)
    private String codigo;

    @Column(name = "numero_contenedor", length = 40)
    private String numeroContenedor;

    @Column(length = 80)
    private String naviera;

    @Column(name = "puerto_origen", length = 80)
    private String puertoOrigen;

    @Column(name = "puerto_destino", length = 80)
    private String puertoDestino;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private EstadoLoteImportacion estado;

    @Column(name = "fecha_embarque")
    private LocalDate fechaEmbarque;

    @Column(length = 500)
    private String notas;

    @Column(name = "ms2_embarque_id", length = 64)
    private String ms2EmbarqueId;

    @Column(nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(nullable = false)
    private Instant actualizadoEn;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        creadoEn = now;
        actualizadoEn = now;
        if (estado == null) {
            estado = EstadoLoteImportacion.PLANIFICADO;
        }
        if (fechaEmbarque == null) {
            fechaEmbarque = LocalDate.now();
        }
    }

    @PreUpdate
    void preUpdate() {
        actualizadoEn = Instant.now();
    }
}
