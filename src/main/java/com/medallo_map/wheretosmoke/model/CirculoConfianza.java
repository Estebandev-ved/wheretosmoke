package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

/**
 * CIRCULOS DE CONFIANZA
 * 
 * Grupos privados donde los usuarios pueden compartir su ubicacion en tiempo
 * real.
 * Ideal para grupos de amigos que quieren saber donde estan los demas de forma
 * segura.
 */
@Data
@Entity
@Table(name = "circulos_confianza")
public class CirculoConfianza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nombre del circulo (ej: "Parche El Poblado", "Crew Centro")
    @Column(nullable = false, length = 100)
    private String nombre;

    // ID del usuario que creo el circulo
    @Column(nullable = false)
    private Long creadorId;

    // Codigo de invitacion para unirse al circulo (ej: "ABC123")
    // Se genera automaticamente al crear el circulo
    @Column(nullable = false, unique = true, length = 10)
    private String codigoInvitacion;

    // Fecha de creacion del circulo
    @Column(nullable = false)
    private LocalDateTime fechaCreacion;

    // Indica si el circulo esta activo o fue eliminado
    @Column(nullable = false)
    private Boolean activo = true;

    // Color para identificar el circulo en el mapa (formato hex: #FF5733)
    @Column(length = 7)
    private String color = "#4CAF50";

    // Generar codigo de invitacion aleatorio
    public void generarCodigoInvitacion() {
        this.codigoInvitacion = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
