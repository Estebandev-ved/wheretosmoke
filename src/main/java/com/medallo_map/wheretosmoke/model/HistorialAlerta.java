package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MODELO DE HISTORIAL DE ALERTAS
 * 
 * Registro histórico de todas las alertas (para mostrar patrones).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "historial_alertas")
public class HistorialAlerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Spot
    @Column(name = "spot_id", nullable = false)
    private Long spotId;

    // Tipo de alerta: "TOMBO" o "RELAX"
    @Column(name = "tipo_alerta", nullable = false)
    private String tipoAlerta;

    // Timestamp exacto
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    // Día de la semana (1-7, Lunes-Domingo) para análisis de patrones
    @Column(name = "dia_semana")
    private Integer diaSemana;

    // Hora del día (0-23) para análisis de patrones
    @Column(name = "hora_dia")
    private Integer horaDia;
}
