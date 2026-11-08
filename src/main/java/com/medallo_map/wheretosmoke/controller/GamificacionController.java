package com.medallo_map.wheretosmoke.controller;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.medallo_map.wheretosmoke.dto.CheckinDTO;
import com.medallo_map.wheretosmoke.dto.MisionesResponseDTO;
import com.medallo_map.wheretosmoke.dto.PerfilGamificacionDTO;
import com.medallo_map.wheretosmoke.dto.ReclamoMisionDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.AccionMision;
import com.medallo_map.wheretosmoke.model.Badge;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.CheckinService;
import com.medallo_map.wheretosmoke.service.GamificacionService;
import com.medallo_map.wheretosmoke.service.MisionService;

import lombok.RequiredArgsConstructor;

/**
 * 🏆 CONTROLADOR DE GAMIFICACIÓN
 */
@RestController
@RequestMapping("/api/gamificacion")
@RequiredArgsConstructor
public class GamificacionController {

    private final GamificacionService gamificacionService;
    private final MisionService misionService;
    private final CheckinService checkinService;

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
     * Obtener perfil de otro usuario (sin datos privados: saldo de monedas ni check-in)
     */
    @GetMapping("/perfil/{usuarioId}")
    public ResponseEntity<PerfilGamificacionDTO> obtenerPerfilUsuario(@PathVariable Long usuarioId,
            @AuthenticationPrincipal Usuario usuario) {
        try {
            PerfilGamificacionDTO perfil = gamificacionService.obtenerPerfil(usuarioId);
            if (usuario == null || !usuarioId.equals(usuario.getId())) {
                perfil.setMonedas(null);
                perfil.setCheckinHoy(null);
            }
            return ResponseEntity.ok(perfil);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/gamificacion/checkin
     * Check-in diario (idempotente por día, zona America/Bogota). Actualiza la racha y paga el bono.
     */
    @PostMapping("/checkin")
    public ResponseEntity<CheckinDTO> checkin(@AuthenticationPrincipal Usuario usuario) {
        Long id = requerir(usuario);
        CheckinDTO dto = checkinService.checkin(id);
        if (!dto.isYaHecho()) {
            misionService.registrarAccion(id, AccionMision.CHECKIN);
        }
        return ResponseEntity.ok(dto);
    }

    /** GET /api/gamificacion/misiones - diarias y semanales vigentes con progreso y segundos para el reinicio. */
    @GetMapping("/misiones")
    public ResponseEntity<MisionesResponseDTO> misiones(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(misionService.obtenerMisiones(requerir(usuario)));
    }

    /** POST /api/gamificacion/misiones/{id}/reclamar - cobra la recompensa una sola vez por periodo. */
    @PostMapping("/misiones/{id}/reclamar")
    public ResponseEntity<ReclamoMisionDTO> reclamar(@PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(misionService.reclamar(requerir(usuario), id));
    }

    private Long requerir(Usuario usuario) {
        if (usuario == null) {
            throw new NegocioException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión");
        }
        return usuario.getId();
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
