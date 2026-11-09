package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Un usuario (bloqueador) bloquea a otro. Único por (bloqueador, bloqueado). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bloqueos", uniqueConstraints = @UniqueConstraint(name = "uk_bloqueo_par", columnNames = {
        "bloqueador_id", "bloqueado_id" }), indexes = @Index(name = "idx_bloqueo_bloqueado", columnList = "bloqueado_id"))
public class Bloqueo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bloqueador_id", nullable = false)
    private Long bloqueadorId;

    @Column(name = "bloqueado_id", nullable = false)
    private Long bloqueadoId;

    @Column(nullable = false)
    private LocalDateTime fecha;
}
