package com.importadora.principal.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "vendedores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 12)
    private String codigo;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "nombre_completo", nullable = false, length = 160)
    private String nombreCompleto;

    @Column(nullable = false, length = 30)
    private String telefono;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(nullable = false, length = 30)
    private String cedula;

    @Column(name = "zona_asignada", length = 80)
    private String zonaAsignada;

    @Column(name = "fecha_ingreso")
    private LocalDate fechaIngreso;

    @Column(name = "meta_mensual", precision = 14, scale = 2)
    private BigDecimal metaMensual;

    @Column(name = "comision_porcentaje", precision = 5, scale = 2)
    private BigDecimal comisionPorcentaje;

    @Column(name = "en_campo", nullable = false)
    private boolean enCampo;

    @Column(nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(nullable = false)
    private Instant actualizadoEn;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        creadoEn = now;
        actualizadoEn = now;
        if (fechaIngreso == null) {
            fechaIngreso = LocalDate.now();
        }
    }

    @PreUpdate
    void preUpdate() {
        actualizadoEn = Instant.now();
    }
}
