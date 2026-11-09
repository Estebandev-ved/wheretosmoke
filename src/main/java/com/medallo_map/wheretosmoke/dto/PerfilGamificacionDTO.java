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

    // Gamificación v2 (monedas/nivel/racha). monedas y checkinHoy son null en perfiles ajenos.
    private Integer nivel;
    private String tituloRango;
    private Integer xpNivelActual;      // XP total donde empieza el nivel actual
    private Integer xpSiguienteNivel;   // XP total para el siguiente nivel (null si nivel máximo)
    private Integer monedas;
    private Integer rachaDias;          // racha vigente (0 si se rompió)
    private Boolean checkinHoy;
    private Boolean cofreDisponible;      // null en perfiles ajenos
    private Integer multiplicadorEvento;  // 2 en hora feliz 4:20, 1 si no
    private java.util.Map<String, String> equipados; // categoría -> imagen del artículo equipado
}
