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
