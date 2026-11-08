package com.medallo_map.wheretosmoke.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.medallo_map.wheretosmoke.dto.ComentarioFotoDTO;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.FotoFeedService;

import lombok.RequiredArgsConstructor;

/**
 * 📸 CONTROLADOR DEL FEED DE FOTOS
 * 
 * Endpoints para likes y comentarios en fotos.
 */
@RestController
@RequestMapping("/api/fotos")
@RequiredArgsConstructor
public class FotoFeedController {

    private final FotoFeedService fotoFeedService;

    // ═══════════════════════════════════════════════════════════════
    // ❤️ LIKES - Toggle
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/fotos/{id}/like
     * Toggle like (si ya dio like lo quita, si no lo agrega)
     * Requiere autenticación
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Debes iniciar sesión para dar like"));
        }
        Map<String, Object> result = fotoFeedService.toggleLike(id, usuario.getId());
        return ResponseEntity.ok(result);
    }

    // ═══════════════════════════════════════════════════════════════
    // 💬 COMENTARIOS EN FOTOS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/fotos/{id}/comentarios
     */
    @GetMapping("/{id}/comentarios")
    public ResponseEntity<List<ComentarioFotoDTO>> obtenerComentarios(@PathVariable Long id) {
        return ResponseEntity.ok(fotoFeedService.obtenerComentarios(id));
    }

    /**
     * POST /api/fotos/{id}/comentarios
     */
    @PostMapping("/{id}/comentarios")
    public ResponseEntity<ComentarioFotoDTO> agregarComentario(
            @PathVariable Long id,
            @RequestBody ComentarioRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        Long usuarioId = usuario != null ? usuario.getId() : null;
        return ResponseEntity.ok(fotoFeedService.agregarComentario(id, usuarioId, request.getTexto()));
    }

    @lombok.Data
    public static class ComentarioRequest {
        private String texto;
    }
}
