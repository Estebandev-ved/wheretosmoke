package com.medallo_map.wheretosmoke.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medallo_map.wheretosmoke.dto.ComunaRankingDTO;
import com.medallo_map.wheretosmoke.service.RankingComunaService;

import lombok.RequiredArgsConstructor;

/** Ranking de comunas (público). */
@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardComunaController {

    private final RankingComunaService rankingComunaService;

    /** GET /api/leaderboard/comunas - comunas ordenadas por XP de sus usuarios activos, con top 3. */
    @GetMapping("/comunas")
    public ResponseEntity<List<ComunaRankingDTO>> comunas() {
        return ResponseEntity.ok(rankingComunaService.obtenerRanking());
    }
}
