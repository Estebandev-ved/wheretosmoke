package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** REGISTRO AUDITABLE de todo movimiento de monedas (recompensas y compras). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "transacciones_monedas", indexes = @Index(name = "idx_trans_monedas_usuario", columnList = "usuario_id,fecha"))
public class TransaccionMonedas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    /** Positivo = ingreso, negativo = gasto. */
    @Column(nullable = false)
    private int delta;

    @Column(name = "saldo_resultante", nullable = false)
    private int saldoResultante;

    /** CHECKIN, MISION, COMPRA. */
    @Column(nullable = false, length = 30)
    private String motivo;

    /** Código de misión / artículo / fecha de check-in, según el motivo. */
    @Column(length = 100)
    private String referencia;

    @Column(nullable = false)
    private LocalDateTime fecha;
}
