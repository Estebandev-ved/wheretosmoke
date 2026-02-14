package com.medallo_map.wheretosmoke.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para representar una ruta calculada
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RutaDTO {

    private List<Coordenada> ruta;
    private Double distanciaMetros;
    private Long tiempoSegundos;
    private Integer reportesCercanos;
    private List<ReporteInfo> reportes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Coordenada {
        private Double latitud;
        private Double longitud;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReporteInfo {
        private Long id;
        private String tipo;
        private Double latitud;
        private Double longitud;
        private String timestamp;
    }
}
