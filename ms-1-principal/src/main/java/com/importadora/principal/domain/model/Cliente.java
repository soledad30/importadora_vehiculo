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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "clientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String tipoDocumento;

    @Column(nullable = false, unique = true, length = 20)
    private String numeroDocumento;

    @Column(nullable = false, length = 80)
    private String nombres;

    @Column(nullable = false, length = 80)
    private String apellidos;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(length = 20)
    private String telefono;

    /** Código visible en listados, p. ej. CLI-001 */
    @Column(unique = true, length = 12)
    private String codigo;

    @Column(length = 200)
    private String direccion;

    @Column(length = 80)
    private String ciudad;

    @Column(length = 500)
    private String notas;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_cliente", nullable = false, length = 20)
    private TipoCliente tipoCliente;

    @Column(nullable = false)
    private boolean activo;

    /**
     * Cartera: si es null, el cliente está "sin asignar" y puede ser tomado por cualquier vendedor.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendedor_asignado_id")
    private Usuario vendedorAsignado;

    @Column(nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(nullable = false)
    private Instant actualizadoEn;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        creadoEn = now;
        actualizadoEn = now;
        activo = true;
        if (tipoCliente == null) {
            tipoCliente = TipoCliente.REGULAR;
        }
    }

    public String nombreCompleto() {
        return (nombres + " " + apellidos).trim();
    }

    @PreUpdate
    void preUpdate() {
        actualizadoEn = Instant.now();
    }
}
