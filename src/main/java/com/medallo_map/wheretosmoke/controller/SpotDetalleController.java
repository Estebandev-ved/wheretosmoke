package com.medallo_map.wheretosmoke.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.medallo_map.wheretosmoke.dto.*;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.SpotDetalleService;

import lombok.RequiredArgsConstructor;

/**
 * 📍 CONTROLADOR DE DETALLE DE SPOTS
 * 
 * Endpoints para fotos, comentarios, calificaciones e historial.
 */
@RestController
@RequestMapping("/api/spots")
@RequiredArgsConstructor
public class SpotDetalleController {

    private final SpotDetalleService spotDetalleService;

    // ═══════════════════════════════════════════════════════════════
    // 📍 DETALLE COMPLETO
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/spots/{id}/detalle
     * Obtener detalle completo de un spot
     */
    @GetMapping("/{id}/detalle")
    public ResponseEntity<SpotDetalleDTO> obtenerDetalle(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        Long usuarioId = usuario != null ? usuario.getId() : null;
        return ResponseEntity.ok(spotDetalleService.obtenerDetalleSpot(id, usuarioId));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📸 FOTOS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/spots/{id}/fotos
     * Obtener fotos de un spot
     */
    @GetMapping("/{id}/fotos")
    public ResponseEntity<List<FotoDTO>> obtenerFotos(@PathVariable Long id) {
        return ResponseEntity.ok(spotDetalleService.obtenerFotos(id));
    }

    /**
     * POST /api/spots/{id}/fotos
     * Subir una foto
     */
    @PostMapping("/{id}/fotos")
    public ResponseEntity<FotoDTO> subirFoto(
            @PathVariable Long id,
            @RequestBody SubirFotoRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        Long usuarioId = usuario != null ? usuario.getId() : null;
        FotoDTO foto = spotDetalleService.subirFoto(id, usuarioId,
                request.getImageData(), request.getDescripcion());
        return ResponseEntity.ok(foto);
    }

    // ═══════════════════════════════════════════════════════════════
    // 💬 COMENTARIOS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/spots/{id}/comentarios
     * Obtener comentarios de un spot
     */
    @GetMapping("/{id}/comentarios")
    public ResponseEntity<List<ComentarioDTO>> obtenerComentarios(@PathVariable Long id) {
        return ResponseEntity.ok(spotDetalleService.obtenerComentarios(id));
    }

    /**
     * POST /api/spots/{id}/comentarios
     * Agregar un comentario
     */
    @PostMapping("/{id}/comentarios")
    public ResponseEntity<ComentarioDTO> agregarComentario(
            @PathVariable Long id,
            @RequestBody AgregarComentarioRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        Long usuarioId = usuario != null ? usuario.getId() : null;
        ComentarioDTO comentario = spotDetalleService.agregarComentario(id, usuarioId, request.getTexto());
        return ResponseEntity.ok(comentario);
    }

    // ═══════════════════════════════════════════════════════════════
    // ⭐ CALIFICACIONES
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/spots/{id}/calificar
     * Calificar un spot
     */
    @PostMapping("/{id}/calificar")
    public ResponseEntity<CalificacionesDetalleDTO> calificarSpot(
            @PathVariable Long id,
            @RequestBody CalificarSpotRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.badRequest().build();
        }
        CalificacionesDetalleDTO resultado = spotDetalleService.calificarSpot(
                id, usuario.getId(),
                request.getEstrellas(),
                request.getPrivacidad(),
                request.getAmbiente(),
                request.getVista(),
                request.getAccesibilidad());
        return ResponseEntity.ok(resultado);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 DTO REQUESTS
    // ═══════════════════════════════════════════════════════════════

    @lombok.Data
    public static class SubirFotoRequest {
        private String imageData;
        private String descripcion;
    }

    @lombok.Data
    public static class AgregarComentarioRequest {
        private String texto;
    }

    @lombok.Data
    public static class CalificarSpotRequest {
        private Integer estrellas;
        private Integer privacidad;
        private Integer ambiente;
        private Integer vista;
        private Integer accesibilidad;
    }
}
