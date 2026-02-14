package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para actividad del sistema
 * 
 * Representa una acción realizada por un usuario
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminActivityDTO {

    private Long id;

    // Usuario que realizó la acción
    private Long usuarioId;
    private String usuarioUsername;

    // Tipo de actividad
    private String tipo; // REGISTRO, SPOT_CREADO, VOTO, COMENTARIO, etc.

    // Descripción de la actividad
    private String descripcion;

    // Timestamp
    private LocalDateTime timestamp;

    // Metadatos adicionales (opcional)
    private String metadata; // JSON con info extra
}
