package com.medallo_map.wheretosmoke.dto;

import com.medallo_map.wheretosmoke.model.Spot;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO (Data Transfer Object) para respuestas con información de votación
 * 
 * Cuando el frontend pide información de un spot, le enviamos:
 * - Los datos del spot (ubicación, nombre, estado)
 * - Cuántos votos TOMBO tiene actualmente
 * - Cuántos votos RELAX tiene actualmente
 * - Si el usuario que está consultando ya votó (para deshabilitar el botón)
 */
@Data
@AllArgsConstructor
public class SpotVotacionDTO {

    private Spot spot;

    // Contador de votos "TOMBO" en las últimas 2 horas
    private int votosTombo;

    // Contador de votos "RELAX" en las últimas 2 horas
    private int votosRelax;

    // true si el usuario actual ya votó en este spot
    private boolean usuarioYaVoto;

    /**
     * Mensaje descriptivo del estado actual
     * Ej: "2/3 votos para marcar como PELIGRO"
     */
    private String mensajeEstado;
}
