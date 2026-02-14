package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO con información completa de spot para ADMIN
 * 
 * Incluye información del creador y métricas de engagement
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSpotDTO {

    // Información del spot
    private Long id;
    private String nombre;
    private String descripcion;
    private Double latitud;
    private Double longitud;
    private String categoria; // PARQUE, CALLE, BAR, etc.
    private String estado; // ACTIVO, INACTIVO, REPORTADO

    // Información del creador
    private Long creadorId;
    private String creadorUsername;

    // Timestamps
    private LocalDateTime creadoEn;
    private LocalDateTime ultimaActualizacion;

    // Métricas de engagement
    private Integer totalVotosTombo;
    private Integer totalVotosRelax;
    private Integer totalComentarios;
    private Integer totalFotos;
    private Integer totalFavoritos;
    private Double calificacionPromedio;

    // Estado de moderación
    private boolean flaggeado; // Marcado como inapropiado
    private String motivoFlag; // Razón por la que fue marcado
    private Integer reportesPendientes; // Cantidad de reportes
}
