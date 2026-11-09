package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Sello del álbum: una comuna completada por un usuario (una sola vez, con su bono de monedas). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sellos_comuna", uniqueConstraints = @UniqueConstraint(name = "uk_sello_usuario_comuna", columnNames = {
        "usuario_id", "comuna" }))
public class SelloComuna {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "comuna", nullable = false, length = 60)
    private String comuna;

    @Column(name = "fecha")
    private LocalDateTime fecha;
}
