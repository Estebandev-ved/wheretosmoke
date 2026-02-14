package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ❤️ MODELO DE LIKE EN FOTOS
 * 
 * Registra qué usuario dio like a qué foto.
 * Restricción unique para evitar likes duplicados.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "likes_fotos", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "foto_id", "usuario_id" })
})
public class LikeFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "foto_id", nullable = false)
    private Long fotoId;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "fecha")
    private LocalDateTime fecha;
}
