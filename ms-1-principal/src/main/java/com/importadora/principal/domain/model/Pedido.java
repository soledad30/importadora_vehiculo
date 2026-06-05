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

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pedidos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehiculo_id", nullable = false)
    private Vehiculo vehiculo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendedor_id")
    private Usuario vendedor;

    /** Código visible: PED-001 */
    @Column(unique = true, length = 12)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private EstadoPedido estado;

    @Column(name = "precio_base", nullable = false, precision = 14, scale = 2)
    private BigDecimal precioBase;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal impuestos;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal envio;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @Column(length = 500)
    private String notas;

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
            estado = EstadoPedido.PENDIENTE;
        }
    }

    @PreUpdate
    void preUpdate() {
        actualizadoEn = Instant.now();
    }
}
