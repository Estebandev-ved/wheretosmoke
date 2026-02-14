package com.medallo_map.wheretosmoke.dto;

import java.time.LocalDateTime;

import com.medallo_map.wheretosmoke.model.Comentario;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO DE COMENTARIO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComentarioDTO {
    private Long id;
    private Long spotId;
    private Long usuarioId;
    private String usuarioNombre;
    private String texto;
    private LocalDateTime fecha;
    private Integer likes;

    public static ComentarioDTO fromComentario(Comentario comentario) {
        return ComentarioDTO.builder()
                .id(comentario.getId())
                .spotId(comentario.getSpotId())
                .usuarioId(comentario.getUsuarioId())
                .usuarioNombre(comentario.getUsuarioNombre())
                .texto(comentario.getTexto())
                .fecha(comentario.getFecha())
                .likes(comentario.getLikes())
                .build();
    }
}
