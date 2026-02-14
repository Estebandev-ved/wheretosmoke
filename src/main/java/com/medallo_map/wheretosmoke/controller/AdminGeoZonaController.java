package com.medallo_map.wheretosmoke.controller;

import com.medallo_map.wheretosmoke.dto.GeoZonaDTO;
import com.medallo_map.wheretosmoke.dto.GeoZonaRequest;
import com.medallo_map.wheretosmoke.service.GeoZonaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 🔒 ADMIN CONTROLLER - GeoZonas
 * 
 * Endpoints para gestión administrativa de zonas
 */
@RestController
@RequestMapping("/api/admin/geozonas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminGeoZonaController {

    private final GeoZonaService geoZonaService;

    /**
     * GET /api/admin/geozonas - Listar todas las zonas
     */
    @GetMapping
    public ResponseEntity<List<GeoZonaDTO>> listarTodasLasZonas() {
        return ResponseEntity.ok(geoZonaService.obtenerTodasLasZonas());
    }

    /**
     * GET /api/admin/geozonas/{id} - Obtener zona por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<GeoZonaDTO> obtenerZonaPorId(@PathVariable Long id) {
        return ResponseEntity.ok(geoZonaService.obtenerZonaPorId(id));
    }

    /**
     * POST /api/admin/geozonas - Crear nueva zona
     */
    @PostMapping
    public ResponseEntity<GeoZonaDTO> crearZona(@RequestBody GeoZonaRequest request) {
        return ResponseEntity.ok(geoZonaService.crearZona(request));
    }

    /**
     * PUT /api/admin/geozonas/{id} - Actualizar zona
     */
    @PutMapping("/{id}")
    public ResponseEntity<GeoZonaDTO> actualizarZona(
            @PathVariable Long id,
            @RequestBody GeoZonaRequest request) {
        return ResponseEntity.ok(geoZonaService.actualizarZona(id, request));
    }

    /**
     * PATCH /api/admin/geozonas/{id}/activar - Activar zona
     */
    @PatchMapping("/{id}/activar")
    public ResponseEntity<GeoZonaDTO> activarZona(@PathVariable Long id) {
        return ResponseEntity.ok(geoZonaService.activarZona(id));
    }

    /**
     * PATCH /api/admin/geozonas/{id}/desactivar - Desactivar zona
     */
    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<GeoZonaDTO> desactivarZona(@PathVariable Long id) {
        return ResponseEntity.ok(geoZonaService.desactivarZona(id));
    }

    /**
     * DELETE /api/admin/geozonas/{id} - Eliminar zona
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarZona(@PathVariable Long id) {
        geoZonaService.eliminarZona(id);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/admin/geozonas/stats - Estadísticas de zonas
     */
    @GetMapping("/stats")
    public ResponseEntity<?> obtenerEstadisticas() {
        return ResponseEntity.ok(
                new java.util.HashMap<String, Object>() {
                    {
                        put("zonasActivas", geoZonaService.contarZonasActivas());
                        put("zonasTotal", geoZonaService.obtenerTodasLasZonas().size());
                    }
                });
    }
}
