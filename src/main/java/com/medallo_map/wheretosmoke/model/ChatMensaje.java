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
 * MENSAJES DE CHAT GEOLOCALIZADO
 * 
 * Mensajes de chat vinculados a spots especificos.
 * Solo usuarios a menos de 50 metros pueden participar en el chat del spot.
 */
@Data
@Entity
@Table(name = "chat_mensajes")
public class ChatMensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID del spot donde se envio el mensaje
    @Column(nullable = false)
    private Long spotId;

    // ID del usuario que envio el mensaje
    @Column(nullable = false)
    private Long usuarioId;

    // Contenido del mensaje
    @Column(nullable = false, length = 500)
    private String mensaje;

    // Ubicacion desde donde se envio el mensaje (para validar distancia)
    @JsonIgnore
    @Column(columnDefinition = "POINT", nullable = false)
    private Point location;

    // Timestamp del mensaje
    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Metodos helper
    public Double getLatitud() {
        return location != null ? location.getY() : null;
    }

    public Double getLongitud() {
        return location != null ? location.getX() : null;
    }
}
