package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO con estadísticas generales del sistema
 * 
 * Dashboard principal del admin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO {

    // ===== USUARIOS =====
    private Long totalUsuarios;
    private Long usuariosActivos;
    private Long usuariosBaneados;
    private Long nuevosUsuariosHoy;
    private Long nuevosUsuariosSemana;
    private Long nuevosUsuariosMes;

    // ===== SPOTS =====
    private Long totalSpots;
    private Long spotsActivos;
    private Long spotsFlaggeados;
    private Long nuevosSpotsHoy;
    private Long nuevosSpotsSemana;
    private Long nuevosSpotsMes;

    // ===== ENGAGEMENT =====
    private Long totalVotos;
    private Long totalVotosTombo;
    private Long totalVotosRelax;
    private Long totalComentarios;
    private Long totalFavoritos;
    private Long totalFotos;

    // ===== ACTIVIDAD RECIENTE =====
    private Long votosUltimas24h;
    private Long comentariosUltimas24h;
    private Long spotsUltimas24h;

    // ===== DISTRIBUCIÓN POR CATEGORÍA =====
    // Map<CategoriaSpot, Cantidad>
    private Map<String, Long> spotsPorCategoria;

    // ===== TENDENCIAS =====
    // Datos para gráficas (últimos 7 días)
    // Map<"2024-01-15", cantidad>
    private Map<String, Long> registrosPorDia;
    private Map<String, Long> spotsPorDia;
    private Map<String, Long> votosPorDia;
}
