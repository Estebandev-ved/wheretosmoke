package com.medallo_map.wheretosmoke.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Cofre de la meta semanal de un círculo, reclamado por un miembro (una vez por semana). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reclamos_meta_circulo", uniqueConstraints = @UniqueConstraint(name = "uk_reclamo_meta", columnNames = {
        "circulo_id", "usuario_id", "semana" }))
public class ReclamoMetaCirculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "circulo_id", nullable = false)
    private Long circuloId;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    /** Lunes de la semana (America/Bogota). */
    @Column(name = "semana", nullable = false)
    private LocalDate semana;

    @Column(name = "fecha")
    private LocalDateTime fecha;
}
