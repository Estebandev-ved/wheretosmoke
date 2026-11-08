package com.medallo_map.wheretosmoke.model;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PROGRESO DE UN USUARIO EN UNA MISIÓN PARA UN PERIODO.
 * periodo = fecha del día (DIARIA) o lunes de la semana (SEMANAL), en America/Bogota.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "misiones_usuario", uniqueConstraints = @UniqueConstraint(name = "uk_mision_usuario_periodo", columnNames = {
        "usuario_id", "mision_id", "periodo" }))
public class MisionUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "mision_id", nullable = false)
    private Mision mision;

    @Column(nullable = false)
    private LocalDate periodo;

    @Builder.Default
    @Column(nullable = false)
    private int progreso = 0;

    @Builder.Default
    @Column(nullable = false)
    private boolean completada = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean reclamada = false;

    /** Bloqueo optimista para que dos eventos simultáneos no pisen el progreso. */
    @Version
    private Long version;
}
