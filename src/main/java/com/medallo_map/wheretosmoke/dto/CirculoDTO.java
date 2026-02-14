package com.medallo_map.wheretosmoke.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para representar un circulo de confianza con sus miembros
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CirculoDTO {

    private Long id;
    private String nombre;
    private Long creadorId;
    private String codigoInvitacion;
    private LocalDateTime fechaCreacion;
    private String color;
    private Integer totalMiembros;
    private List<MiembroDTO> miembros;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MiembroDTO {
        private Long usuarioId;
        private String username;
        private Boolean compartiendoUbicacion;
        private UbicacionDTO ubicacionActual;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UbicacionDTO {
        private Double latitud;
        private Double longitud;
        private LocalDateTime timestamp;
        private Long enSpotId;
    }
}
