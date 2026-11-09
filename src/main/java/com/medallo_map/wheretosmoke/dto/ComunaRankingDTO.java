package com.medallo_map.wheretosmoke.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Posición de una comuna en el ranking (ver RankingComunaService). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComunaRankingDTO {
    private int posicion;
    private String comuna;
    /** Suma del XP total de los usuarios activos en la comuna. */
    private long xpTotal;
    private int usuariosActivos;
    private int totalSpots;
    private List<Top> top;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Top {
        private Long usuarioId;
        private String username;
        private int puntos;
        private int nivel;
    }
}
