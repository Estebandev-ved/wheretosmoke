package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 💬 MODELO DE COMENTARIO EN FOTOS
 * 
 * Comentarios de usuarios en fotos del feed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "comentarios_fotos")
public class ComentarioFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Foto a la que pertenece el comentario
    @Column(name = "foto_id", nullable = false)
    private Long fotoId;

    // Usuario que hizo el comentario
    @Column(name = "usuario_id")
    private Long usuarioId;

    // Nombre del usuario
    @Column(name = "usuario_nombre")
    private String usuarioNombre;

    // Texto del comentario
    @Column(nullable = false, length = 300)
    private String texto;

    // Fecha del comentario
    @Column(name = "fecha")
    private LocalDateTime fecha;
}
