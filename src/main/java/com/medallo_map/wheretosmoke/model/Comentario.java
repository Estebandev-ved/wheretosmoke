package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 💬 MODELO DE COMENTARIO
 * 
 * Comentarios de usuarios en spots.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "comentarios")
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Spot al que pertenece el comentario
    @Column(name = "spot_id", nullable = false)
    private Long spotId;

    // Usuario que hizo el comentario
    @Column(name = "usuario_id")
    private Long usuarioId;

    // Nombre del usuario (para mostrar sin consulta extra)
    @Column(name = "usuario_nombre")
    private String usuarioNombre;

    // Texto del comentario
    @Column(nullable = false, length = 500)
    private String texto;

    // Fecha del comentario
    @Column(name = "fecha")
    private LocalDateTime fecha;

    // Cantidad de likes
    @Column(name = "likes")
    @Builder.Default
    private Integer likes = 0;
}
