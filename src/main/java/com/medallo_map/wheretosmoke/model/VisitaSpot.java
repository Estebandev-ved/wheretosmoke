package com.medallo_map.wheretosmoke.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * VISITA A UN SPOT: una fila por (usuario, spot, día Bogotá).
 * Se registra cuando un usuario con sesión crea un spot, vota, califica, comenta o sube una foto.
 * La unicidad por día evita inflar contadores repitiendo la misma acción en el mismo spot.
 * Alimenta el álbum por comuna, el ranking por comuna y la meta semanal de los círculos.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "visitas_spot", uniqueConstraints = @UniqueConstraint(name = "uk_visita_usuario_spot_dia", columnNames = {
        "usuario_id", "spot_id", "dia" }), indexes = {
                @Index(name = "idx_visita_dia", columnList = "dia"),
                @Index(name = "idx_visita_spot", columnList = "spot_id") })
public class VisitaSpot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "spot_id", nullable = false)
    private Long spotId;

    @Column(name = "dia", nullable = false)
    private LocalDate dia;

    @Column(name = "fecha")
    private LocalDateTime fecha;
}
