package com.medallo_map.wheretosmoke.dto;

import java.util.List;

import com.medallo_map.wheretosmoke.model.Badge;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO DE PERFIL DE GAMIFICACIÓN
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerfilGamificacionDTO {
    private Long usuarioId;
    private String username;
    private Integer puntos;
    private List<Badge> badgesGanados;
    private Integer posicionLeaderboard;

    // Estadísticas
    private Integer spotsCreados;
    private Integer reportesHechos;
    private Integer comentariosHechos;
    private Integer fotosSubidas;

    // Siguiente badge a conseguir
    private Badge siguienteBadge;
    private Integer puntosFaltantes;
}
