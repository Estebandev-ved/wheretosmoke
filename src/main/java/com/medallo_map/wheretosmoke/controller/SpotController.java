package com.medallo_map.wheretosmoke.controller;

import com.medallo_map.wheretosmoke.dto.SpotVotacionDTO;
import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.service.SpotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 🎮 CONTROLADOR DE SPOTS - API REST
 * 
 * Endpoints actualizados para el nuevo sistema de votación:
 * - GET /api/spots → Lista todos con contadores de votos
 * - POST /api/spots → Crear nuevo spot
 * - POST /api/spots/{id}/tombo?fingerprint=xxx → Votar TOMBO
 * - POST /api/spots/{id}/relax?fingerprint=xxx → Votar RELAX
 */
@RestController
@RequestMapping("/api/spots")
public class SpotController {

    @Autowired
    private SpotService spotService;

    /**
     * 🗺️ GET - Obtener todos los spots (con información de votación)
     * 
     * Ahora recibe el fingerprint del usuario para indicar si ya votó
     * Query param opcional: ?fingerprint=abc123
     */
    @GetMapping
    public List<SpotVotacionDTO> obtenerMapa(@RequestParam(required = false) String fingerprint) {
        // Si no hay fingerprint, usamos uno vacío (no podrá votar)
        return spotService.obtenerTodosConVotos(fingerprint != null ? fingerprint : "");
    }

    /**
     * 🌍 GET - Spots cercanos
     */
    @GetMapping("/cercanos")
    public List<com.medallo_map.wheretosmoke.dto.SpotDetalleDTO> obtenerCercanos(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius) {
        return spotService.getSpotsCercanos(lat, lng, radius);
    }

    /**
     * ⭐ GET - Mejores spots
     */
    @GetMapping("/mejores")
    public List<com.medallo_map.wheretosmoke.dto.SpotDetalleDTO> obtenerMejores() {
        return spotService.getMejoresSpots();
    }

    /**
     * 🔥 GET - Trending spots
     */
    @GetMapping("/trending")
    public List<com.medallo_map.wheretosmoke.dto.SpotDetalleDTO> obtenerTrending() {
        return spotService.getTrendingSpots();
    }

    /**
     * 📍 POST - Crear un nuevo spot
     * 
     * Este endpoint NO cambió, sigue igual
     */
    @PostMapping
    public Spot crearSpot(@RequestBody Spot spot) {
        return spotService.guardarSpot(spot);
    }

    /**
     * 🚨 POST - Votar TOMBO (policía)
     * 
     * CAMBIO IMPORTANTE: Ahora requiere el fingerprint del usuario
     * URL: POST /api/spots/1/tombo?fingerprint=abc123
     * 
     * Retorna: SpotVotacionDTO con contadores actualizados
     */
    @PostMapping("/{id}/tombo")
    public SpotVotacionDTO alertaPolicia(
            @PathVariable Long id,
            @RequestParam String fingerprint) {
        return spotService.reportarPolicia(id, fingerprint);
    }

    /**
     * 🥦 POST - Votar RELAX (seguro)
     * 
     * Similar a tombo, pero marca como seguro
     */
    @PostMapping("/{id}/relax")
    public SpotVotacionDTO alertaRelax(
            @PathVariable Long id,
            @RequestParam String fingerprint) {
        return spotService.reportarRelax(id, fingerprint);
    }
}