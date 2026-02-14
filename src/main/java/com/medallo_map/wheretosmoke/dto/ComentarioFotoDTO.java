package com.medallo_map.wheretosmoke.dto;

import java.time.LocalDateTime;

import com.medallo_map.wheretosmoke.model.ComentarioFoto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO DE COMENTARIO EN FOTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComentarioFotoDTO {
    private Long id;
    private Long fotoId;
    private Long usuarioId;
    private String usuarioNombre;
    private String texto;
    private LocalDateTime fecha;

    public static ComentarioFotoDTO fromComentarioFoto(ComentarioFoto c) {
        return ComentarioFotoDTO.builder()
                .id(c.getId())
                .fotoId(c.getFotoId())
                .usuarioId(c.getUsuarioId())
                .usuarioNombre(c.getUsuarioNombre())
                .texto(c.getTexto())
                .fecha(c.getFecha())
                .build();
    }
}
