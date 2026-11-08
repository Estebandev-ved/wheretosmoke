package com.medallo_map.wheretosmoke.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.FavoritosService;

import lombok.RequiredArgsConstructor;

/**
 * ❤️ CONTROLADOR DE FAVORITOS
 */
@RestController
@RequestMapping("/api/favoritos")
@RequiredArgsConstructor
public class FavoritosController {

    private final FavoritosService favoritosService;

    /**
     * GET /api/favoritos
     * Obtener mis favoritos
     */
    @GetMapping
    public ResponseEntity<List<Spot>> obtenerMisFavoritos(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(favoritosService.obtenerMisFavoritos(usuario.getId()));
    }

    /**
     * POST /api/favoritos/{spotId}
     * Agregar a favoritos
     */
    @PostMapping("/{spotId}")
    public ResponseEntity<Map<String, Object>> agregarFavorito(
            @PathVariable Long spotId,
            @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Debes iniciar sesión"));
        }

        boolean agregado = favoritosService.agregarFavorito(usuario.getId(), spotId);
        return ResponseEntity.ok(Map.of(
                "success", agregado,
                "message", agregado ? "❤️ Agregado a favoritos" : "Ya estaba en favoritos"));
    }

    /**
     * DELETE /api/favoritos/{spotId}
     * Quitar de favoritos
     */
    @DeleteMapping("/{spotId}")
    public ResponseEntity<Map<String, Object>> quitarFavorito(
            @PathVariable Long spotId,
            @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Debes iniciar sesión"));
        }

        boolean quitado = favoritosService.quitarFavorito(usuario.getId(), spotId);
        return ResponseEntity.ok(Map.of(
                "success", quitado,
                "message", quitado ? "💔 Quitado de favoritos" : "No estaba en favoritos"));
    }

    /**
     * GET /api/favoritos/{spotId}/check
     * Verificar si es favorito
     */
    @GetMapping("/{spotId}/check")
    public ResponseEntity<Map<String, Boolean>> verificarFavorito(
            @PathVariable Long spotId,
            @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.ok(Map.of("esFavorito", false));
        }
        boolean esFavorito = favoritosService.esFavorito(usuario.getId(), spotId);
        return ResponseEntity.ok(Map.of("esFavorito", esFavorito));
    }

    /**
     * POST /api/favoritos/{spotId}/notificaciones
     * Toggle notificaciones para un favorito
     */
    @PostMapping("/{spotId}/notificaciones")
    public ResponseEntity<Map<String, Object>> toggleNotificaciones(
            @PathVariable Long spotId,
            @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.badRequest().build();
        }

        boolean activas = favoritosService.toggleNotificaciones(usuario.getId(), spotId);
        return ResponseEntity.ok(Map.of(
                "notificacionesActivas", activas,
                "message", activas ? "🔔 Notificaciones activadas" : "🔕 Notificaciones desactivadas"));
    }
}
