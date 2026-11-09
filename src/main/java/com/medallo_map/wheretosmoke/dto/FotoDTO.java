package com.medallo_map.wheretosmoke.dto;

import java.time.LocalDateTime;

import com.medallo_map.wheretosmoke.model.Foto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO DE FOTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FotoDTO {
    private Long id;
    private Long spotId;
    private Long usuarioId;
    private String usuarioNombre;
    private String imageData;
    private String descripcion;
    private LocalDateTime fechaSubida;
    private Integer likes;
    /** Conteo por emoji (siempre incluye los 5 permitidos, con 0 si nadie reaccionó). */
    private java.util.Map<String, Integer> reacciones;
    /** Emoji con el que reaccionó el usuario autenticado, o null. */
    private String miReaccion;

    public static FotoDTO fromFoto(Foto foto) {
        return FotoDTO.builder()
                .id(foto.getId())
                .spotId(foto.getSpotId())
                .usuarioId(foto.getUsuarioId())
                .imageData(foto.getImageData())
                .descripcion(foto.getDescripcion())
                .fechaSubida(foto.getFechaSubida())
                .likes(foto.getLikes())
                .build();
    }
}
