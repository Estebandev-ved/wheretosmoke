package com.medallo_map.wheretosmoke.controller;

import com.medallo_map.wheretosmoke.dto.GeoZonaPublicaDTO;
import com.medallo_map.wheretosmoke.service.GeoZonaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 🌍 PUBLIC CONTROLLER - GeoZonas
 * 
 * Endpoints públicos para consultar zonas activas
 */
@RestController
@RequestMapping("/api/geozonas")
@RequiredArgsConstructor
public class GeoZonaController {

    private final GeoZonaService geoZonaService;

    /**
     * GET /api/geozonas/activas - Obtener zonas activas
     */
    @GetMapping("/activas")
    public ResponseEntity<List<GeoZonaPublicaDTO>> obtenerZonasActivas() {
        return ResponseEntity.ok(geoZonaService.obtenerZonasActivas());
    }

    /**
     * POST /api/geozonas/validar - Validar si un punto está en zona permitida
     */
    @PostMapping("/validar")
    public ResponseEntity<Map<String, Object>> validarPunto(@RequestBody Map<String, Double> punto) {
        double lat = punto.get("lat");
        double lng = punto.get("lng");

        Map<String, Object> respuesta = new HashMap<>();

        // Validar Medellín
        if (!geoZonaService.puntoEnMedellin(lat, lng)) {
            respuesta.put("permitido", false);
            respuesta.put("mensaje", "🚫 Solo se permiten spots en Medellín");
            respuesta.put("razon", "FUERA_DE_MEDELLIN");
            return ResponseEntity.ok(respuesta);
        }

        // Validar zona activa
        if (!geoZonaService.puntoEnZonaPermitida(lat, lng)) {
            respuesta.put("permitido", false);
            respuesta.put("mensaje", "🚧 Esta zona aún no está disponible. ¡Próximamente!");
            respuesta.put("razon", "ZONA_INACTIVA");
            return ResponseEntity.ok(respuesta);
        }

        // Punto OK
        respuesta.put("permitido", true);
        respuesta.put("mensaje", "✅ Ubicación válida");
        return ResponseEntity.ok(respuesta);
    }
}
