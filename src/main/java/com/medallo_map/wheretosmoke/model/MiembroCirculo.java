package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

/**
 * MIEMBROS DE CIRCULOS
 * 
 * Relacion Many-to-Many entre Usuarios y Circulos de Confianza.
 * Un usuario puede estar en varios circulos y un circulo tiene varios usuarios.
 */
@Data
@Entity
@Table(name = "miembros_circulo")
public class MiembroCirculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID del circulo al que pertenece
    @Column(nullable = false)
    private Long circuloId;

    // ID del usuario miembro
    @Column(nullable = false)
    private Long usuarioId;

    // Fecha en que se unio al circulo
    @Column(nullable = false)
    private LocalDateTime fechaUnion;

    // Indica si esta compartiendo ubicacion actualmente
    @Column(nullable = false)
    private Boolean compartiendoUbicacion = false;

    // Indica si sigue en el circulo (false = se salio)
    @Column(nullable = false)
    private Boolean activo = true;
}
