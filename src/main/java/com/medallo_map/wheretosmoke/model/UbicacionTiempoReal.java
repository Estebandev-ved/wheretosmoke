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
 * UBICACION EN TIEMPO REAL
 * 
 * Almacena la ubicacion actual de usuarios que estan compartiendo su posicion
 * en un circulo de confianza. Los datos se actualizan cada 10-30 segundos.
 * 
 * TTL: Registros se eliminan automaticamente despues de 1 hora sin actualizar.
 */
@Data
@Entity
@Table(name = "ubicaciones_tiempo_real")
public class UbicacionTiempoReal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID del usuario
    @Column(nullable = false)
    private Long usuarioId;

    // ID del circulo en el que esta compartiendo
    @Column(nullable = false)
    private Long circuloId;

    // Ubicacion GPS actual
    @JsonIgnore
    @Column(columnDefinition = "POINT", nullable = false)
    private Point location;

    // Timestamp de la ultima actualizacion
    @Column(nullable = false)
    private LocalDateTime timestamp;

    // ID del spot donde esta (opcional, null si no esta en ningun spot)
    private Long enSpotId;

    // Metodos helper para compatibilidad JSON
    public Double getLatitud() {
        return location != null ? location.getY() : null;
    }

    public Double getLongitud() {
        return location != null ? location.getX() : null;
    }
}
