package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import org.locationtech.jts.geom.Point;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

/**
 * MODELO DE REPORTE INDIVIDUAL
 * 
 * Cada vez que un usuario vota (Tombo o Relax), se crea un registro aquí.
 * Esto nos permite:
 * - Contar votos en tiempo real
 * - Prevenir que la misma persona vote múltiples veces
 * - Limpiar automáticamente votos viejos (después de 2 horas)
 */
@Data
@Entity
@Table(name = "reportes")
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID del spot al que pertenece este voto
    private Long spotId;

    // Tipo de reporte: "TOMBO" (policía) o "RELAX" (seguro)
    private String tipoReporte;

    /**
     * Identificador unico del usuario que voto
     * 
     * Por ahora usamos un "fingerprint" del navegador (generado con FingerprintJS)
     * Esto identifica al usuario sin necesidad de login.
     * 
     * Cuando agreguemos autenticacion, esto sera el ID del usuario.
     */
    private String userFingerprint;

    // UBICACION DEL REPORTE
    // Almacena la ubicacion geografica donde se hizo el reporte
    // Necesario para calcular rutas de bajo perfil que eviten zonas con reportes
    // Nota: En MariaDB el SRID se establece via ST_PointFromText, no en el DDL
    @JsonIgnore
    @Column(columnDefinition = "POINT")
    private Point location;

    // Momento exacto en que se hizo el voto
    private LocalDateTime timestamp;

    // Getters para coordenadas (para mantener retrocompatibilidad)
    public Double getLatitud() {
        return location != null ? location.getY() : null;
    }

    public Double getLongitud() {
        return location != null ? location.getX() : null;
    }

    // Alias para tipoReporte
    public String getTipo() {
        return tipoReporte;
    }

    // Alias para timestamp
    public LocalDateTime getFechaCreacion() {
        return timestamp;
    }
}
