package com.importadora.principal.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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
@Table(name = "importaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Importacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 16)
    private String codigo;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false, unique = true)
    private Pedido pedido;

    @Column(nullable = false, length = 80)
    private String paisOrigen;

    @Column(nullable = false, length = 80)
    private String aduana;

    @Column(length = 40)
    private String numeroDespacho;

    @Column(name = "puerto_origen", length = 80)
    private String puertoOrigen;

    @Column(name = "puerto_destino", length = 80)
    private String puertoDestino;

    @Column(length = 80)
    private String naviera;

    @Column(name = "numero_bl", length = 40)
    private String numeroBl;

    @Column(name = "numero_contenedor", length = 40)
    private String numeroContenedor;

    /** Referencia al embarque en MS-2 cuando esté disponible. */
    @Column(name = "ms2_embarque_id", length = 64)
    private String ms2EmbarqueId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private EstadoImportacion estado;

    @Column(nullable = false)
    private LocalDate fechaInicio;

    private LocalDate fechaEstimadaEntrega;

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
            estado = EstadoImportacion.SOLICITADA;
        }
        if (fechaInicio == null) {
            fechaInicio = LocalDate.now();
        }
    }

    @PreUpdate
    void preUpdate() {
        actualizadoEn = Instant.now();
    }
}
