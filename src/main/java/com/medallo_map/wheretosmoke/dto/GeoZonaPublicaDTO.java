package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO - GeoZona Pública (Solo para usuarios)
 * 
 * Versión simplificada sin datos administrativos
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoZonaPublicaDTO {
    private Long id;
    private String nombre;
    private String tipo;
    private String poligonoJson;
    private String color;
    private String descripcion;
}
