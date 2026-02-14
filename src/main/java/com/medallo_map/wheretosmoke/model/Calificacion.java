package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MODELO DE CALIFICACIÓN
 * 
 * Calificaciones de usuarios para spots (1-5 estrellas).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "calificaciones")
public class Calificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 📍 Spot calificado
    @Column(name = "spot_id", nullable = false)
    private Long spotId;

    // 👤 Usuario que calificó
    @Column(name = "usuario_id")
    private Long usuarioId;

    // ⭐ Calificación general (1-5)
    @Column(nullable = false)
    private Integer estrellas;

    // 🔒 Privacidad (1-5)
    @Column(name = "privacidad")
    private Integer privacidad;

    // 🌿 Ambiente (1-5)
    @Column(name = "ambiente")
    private Integer ambiente;

    // 🏔️ Vista (1-5)
    @Column(name = "vista")
    private Integer vista;

    // 🚶 Accesibilidad (1-5)
    @Column(name = "accesibilidad")
    private Integer accesibilidad;

    // 📅 Fecha de calificación
    @Column(name = "fecha")
    private LocalDateTime fecha;
}
