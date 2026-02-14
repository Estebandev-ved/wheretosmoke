package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO con información completa de usuario para ADMIN
 * 
 * Incluye toda la información sensible que solo el admin puede ver
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {

    // Información básica
    private Long id;
    private String username;
    private String email;
    private String genero;
    private String role; // USER, ADMIN

    // Estado de la cuenta
    private boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    // Estadísticas de actividad
    private Integer spotsCreados;
    private Integer reportesHechos;
    private Integer comentariosHechos;

    // Gamificación
    private Integer puntos;
    private String badges;

    // Información adicional para admin
    private Long totalVotos; // Total de votos que ha hecho
    private Long totalFavoritos; // Total de favoritos guardados
    private Integer diasActivo; // Días desde el registro
}
