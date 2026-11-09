package com.medallo_map.wheretosmoke.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reacción con emoji a una foto. Una por usuario y foto (la unicidad lo garantiza).
 * Se guarda un código (FUEGO, RISA...) y no el emoji, para no depender del charset de la BD.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reacciones_foto", uniqueConstraints = @UniqueConstraint(name = "uk_reaccion_foto_usuario", columnNames = {
        "foto_id", "usuario_id" }))
public class ReaccionFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "foto_id", nullable = false)
    private Long fotoId;

    @Column(name = "codigo", nullable = false, length = 20)
    private String codigo;
}
