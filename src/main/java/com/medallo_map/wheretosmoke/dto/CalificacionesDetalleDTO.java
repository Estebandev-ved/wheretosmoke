package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO DE CALIFICACIONES DETALLADAS
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalificacionesDetalleDTO {
    private Double promedioGeneral;
    private Double promedioPrivacidad;
    private Double promedioAmbiente;
    private Double promedioVista;
    private Double promedioAccesibilidad;
    private Integer totalCalificaciones;
}
