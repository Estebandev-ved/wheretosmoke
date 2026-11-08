package com.medallo_map.wheretosmoke.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CATÁLOGO DE MISIONES (definición, no progreso).
 * El progreso por usuario vive en {@link MisionUsuario}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "misiones")
public class Mision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String codigo;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(length = 300)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMision tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AccionMision accion;

    /** Veces que hay que ejecutar la acción. Es también el tope diario/semanal anti-farmeo. */
    @Column(nullable = false)
    private int meta;

    @Column(name = "recompensa_xp", nullable = false)
    private int recompensaXp;

    @Column(name = "recompensa_monedas", nullable = false)
    private int recompensaMonedas;

    @Builder.Default
    @Column(nullable = false)
    private boolean activa = true;
}
