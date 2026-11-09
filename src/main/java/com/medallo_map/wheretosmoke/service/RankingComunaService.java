package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.ComunaRankingDTO;
import com.medallo_map.wheretosmoke.repository.SpotRepository;
import com.medallo_map.wheretosmoke.repository.VisitaSpotRepository;

import lombok.RequiredArgsConstructor;

/**
 * RANKING POR COMUNA (público).
 *
 * Definición: el puntaje de una comuna es la SUMA del XP total (usuarios.puntos) de los usuarios
 * DISTINTOS que visitaron (crearon, votaron, calificaron, comentaron o subieron foto) algún spot de
 * esa comuna en los últimos 30 días. Un usuario activo en varias comunas suma a cada una.
 * Top 3 de cada comuna = los 3 usuarios activos con más XP total.
 * Eficiente: 2 consultas en total (usuarios activos por comuna y spots por comuna), el resto en memoria.
 */
@Service
@RequiredArgsConstructor
public class RankingComunaService {

    public static final int DIAS_ACTIVIDAD = 30;
    public static final int TOP_POR_COMUNA = 3;

    private final VisitaSpotRepository visitaRepository;
    private final SpotRepository spotRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<ComunaRankingDTO> obtenerRanking() {
        LocalDate desde = LocalDate.now(clock).minusDays(DIAS_ACTIVIDAD);
        Map<String, List<ComunaRankingDTO.Top>> activos = new HashMap<>();
        for (Object[] f : visitaRepository.usuariosActivosPorComuna(desde)) {
            int puntos = ((Number) f[3]).intValue();
            activos.computeIfAbsent((String) f[0], k -> new ArrayList<>()).add(ComunaRankingDTO.Top.builder()
                    .usuarioId(((Number) f[1]).longValue()).username((String) f[2])
                    .puntos(puntos).nivel(ReglasGamificacion.nivelPara(puntos)).build());
        }
        Map<String, Integer> totales = new HashMap<>();
        for (Object[] f : spotRepository.contarPorComuna()) {
            totales.put((String) f[0], ((Number) f[1]).intValue());
        }

        List<ComunaRankingDTO> ranking = new ArrayList<>();
        for (ComunasMedellin.Comuna c : ComunasMedellin.TODAS) {
            List<ComunaRankingDTO.Top> usuarios = activos.getOrDefault(c.nombre(), List.of());
            long xp = usuarios.stream().mapToLong(ComunaRankingDTO.Top::getPuntos).sum();
            List<ComunaRankingDTO.Top> top = usuarios.stream()
                    .sorted(Comparator.comparingInt(ComunaRankingDTO.Top::getPuntos).reversed()
                            .thenComparing(ComunaRankingDTO.Top::getUsername))
                    .limit(TOP_POR_COMUNA).toList();
            ranking.add(ComunaRankingDTO.builder().comuna(c.nombre()).xpTotal(xp)
                    .usuariosActivos(usuarios.size()).totalSpots(totales.getOrDefault(c.nombre(), 0))
                    .top(top).build());
        }
        ranking.sort(Comparator.comparingLong(ComunaRankingDTO::getXpTotal).reversed()
                .thenComparing(ComunaRankingDTO::getComuna));
        for (int i = 0; i < ranking.size(); i++) {
            ranking.get(i).setPosicion(i + 1);
        }
        return ranking;
    }
}
