package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * REQUEST - Crear/Actualizar GeoZona
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeoZonaRequest {
    private String nombre;
    private String tipo;
    private String poligonoJson;
    private Boolean activa;
    private String color;
    private String descripcion;
    private Integer orden;
}
