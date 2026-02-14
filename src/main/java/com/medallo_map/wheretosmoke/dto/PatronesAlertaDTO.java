package com.medallo_map.wheretosmoke.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO DE PATRONES DE ALERTA
 * 
 * Análisis de patrones de alertas para un spot.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatronesAlertaDTO {
    // Alertas por día de la semana (1=Lunes, 7=Domingo)
    private Map<Integer, Integer> alertasPorDia;

    // Alertas por hora del día (0-23)
    private Map<Integer, Integer> alertasPorHora;

    // Hora más peligrosa
    private Integer horaMasPeligrosa;

    // Día más peligroso
    private Integer diaMasPeligroso;

    // Mensaje de resumen
    private String resumen;
}
