package com.medallo_map.wheretosmoke.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * GEO ZONA - Sistema de zonas geográficas
 * 
 * Permite controlar qué áreas de Medellín están activas para crear spots.
 * Cada zona tiene un polígono que define sus límites.
 */
@Entity
@Table(name = "geo_zonas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoZona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre; // "El Poblado", "Laureles", etc.

    @Column(nullable = false, length = 50)
    private String tipo; // COMUNA, BARRIO, CORREGIMIENTO

    /**
     * Polígono en formato GeoJSON
     * Ejemplo:
     * {
     * "type": "Polygon",
     * "coordinates": [[[lng, lat], [lng, lat], ...]]
     * }
     */
    @Column(name = "poligono_json", columnDefinition = "TEXT", nullable = false)
    private String poligonoJson;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activa = false; // Si está habilitada para crear spots

    @Column(length = 7) // #RRGGBB
    @Builder.Default
    private String color = "#00C851"; // Color para visualización

    @Column(name = "fecha_activacion")
    private LocalDateTime fechaActivacion;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "orden")
    private Integer orden; // Para ordenar en lista (1, 2, 3...)

    /**
     * Metadatos adicionales
     */
    @Column(name = "total_spots")
    @Builder.Default
    private Integer totalSpots = 0; // Cache del total de spots en esta zona

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (activa && fechaActivacion == null) {
            fechaActivacion = LocalDateTime.now();
        }
    }
}
