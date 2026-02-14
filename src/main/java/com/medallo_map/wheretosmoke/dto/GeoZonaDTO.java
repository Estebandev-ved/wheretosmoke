package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO - GeoZona (Completo para admin)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoZonaDTO {
    private Long id;
    private String nombre;
    private String tipo;
    private String poligonoJson;
    private Boolean activa;
    private String color;
    private LocalDateTime fechaActivacion;
    private LocalDateTime fechaCreacion;
    private String descripcion;
    private Integer orden;
    private Integer totalSpots;
}
