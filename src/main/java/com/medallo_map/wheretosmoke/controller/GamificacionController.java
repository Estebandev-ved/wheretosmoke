package com.medallo_map.wheretosmoke.controller;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.medallo_map.wheretosmoke.dto.PerfilGamificacionDTO;
import com.medallo_map.wheretosmoke.model.Badge;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.GamificacionService;

import lombok.RequiredArgsConstructor;

/**
 * 🏆 CONTROLADOR DE GAMIFICACIÓN
 */
@RestController
@RequestMapping("/api/gamificacion")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GamificacionController {

    private final GamificacionService gamificacionService;

    /**
     * GET /api/gamificacion/perfil
     * Obtener mi perfil de gamificación
     */
    @GetMapping("/perfil")
    public ResponseEntity<PerfilGamificacionDTO> obtenerMiPerfil(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(gamificacionService.obtenerPerfil(usuario.getId()));
    }

    /**
     * GET /api/gamificacion/leaderboard
     * Obtener top 10 usuarios
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<PerfilGamificacionDTO>> obtenerLeaderboard() {
        return ResponseEntity.ok(gamificacionService.obtenerLeaderboard());
    }

    /**
     * GET /api/gamificacion/badges
     * Obtener lista de todos los badges disponibles
     */
    @GetMapping("/badges")
    public ResponseEntity<List<BadgeInfoDTO>> obtenerBadges() {
        List<BadgeInfoDTO> badges = Arrays.stream(Badge.values())
                .map(b -> new BadgeInfoDTO(b.name(), b.getNombre(), b.getDescripcion(), b.getPuntosRequeridos()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(badges);
    }

    /**
     * GET /api/gamificacion/perfil/{usuarioId}
     * Obtener perfil de otro usuario
     */
    @GetMapping("/perfil/{usuarioId}")
    public ResponseEntity<PerfilGamificacionDTO> obtenerPerfilUsuario(@PathVariable Long usuarioId) {
        try {
            return ResponseEntity.ok(gamificacionService.obtenerPerfil(usuarioId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DTO para info de badges
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class BadgeInfoDTO {
        private String id;
        private String nombre;
        private String descripcion;
        private int puntosRequeridos;
    }
}
