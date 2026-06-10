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
@Table(name = "traspasos_propiedad")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TraspasoPropiedad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false, unique = true)
    private Pedido pedido;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_comprador", nullable = false, length = 24)
    private TipoComprador tipoComprador;

    @Column(name = "titular_nombre", nullable = false, length = 160)
    private String titularNombre;

    @Column(length = 20)
    private String rtn;

    @Column(name = "numero_traspaso", length = 40)
    private String numeroTraspaso;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private EstadoTraspaso estado;

    @Column(length = 120)
    private String notario;

    @Column(name = "fecha_traspaso")
    private LocalDate fechaTraspaso;

    @Column(length = 500)
    private String observaciones;

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
            estado = EstadoTraspaso.PENDIENTE;
        }
    }

    @PreUpdate
    void preUpdate() {
        actualizadoEn = Instant.now();
    }
}
