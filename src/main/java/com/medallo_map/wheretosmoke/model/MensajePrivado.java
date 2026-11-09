package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MENSAJE PRIVADO ENTRE DOS AMIGOS.
 * El texto se guarda tal cual (nunca se interpreta como HTML; el cliente debe renderizarlo como texto).
 * (usuario_menor, usuario_mayor) identifica la conversación; el índice (par, id) sirve la paginación.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "mensajes_privados", indexes = {
        @Index(name = "idx_mp_par_id", columnList = "usuario_menor, usuario_mayor, id"),
        @Index(name = "idx_mp_destino_leido", columnList = "para_id, leido, de_id") })
public class MensajePrivado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_menor", nullable = false)
    private Long usuarioMenor;

    @Column(name = "usuario_mayor", nullable = false)
    private Long usuarioMayor;

    @Column(name = "de_id", nullable = false)
    private Long deId;

    @Column(name = "para_id", nullable = false)
    private Long paraId;

    @Column(nullable = false, length = 500)
    private String texto;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Builder.Default
    @Column(nullable = false)
    private boolean leido = false;
}
