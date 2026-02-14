package com.medallo_map.wheretosmoke.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.medallo_map.wheretosmoke.dto.RutaDTO;
import com.medallo_map.wheretosmoke.service.RutaService;

/**
 * CONTROLADOR DE RUTAS DE BAJO PERFIL
 * 
 * Endpoints para calcular rutas evitando zonas con reportes policiales
 */
@RestController
@RequestMapping("/api/rutas")
public class RutaController {

    @Autowired
    private RutaService rutaService;

    /**
     * Calcular ruta entre dos puntos
     * 
     * GET
     * /api/rutas/calcular?origenLat=6.24&origenLng=-75.58&destinoLat=6.25&destinoLng=-75.57
     */
    @GetMapping("/calcular")
    public ResponseEntity<RutaDTO> calcularRuta(
            @RequestParam Double origenLat,
            @RequestParam Double origenLng,
            @RequestParam Double destinoLat,
            @RequestParam Double destinoLng) {

        RutaDTO ruta = rutaService.calcularRuta(origenLat, origenLng, destinoLat, destinoLng);
        return ResponseEntity.ok(ruta);
    }

    /**
     * Evaluar seguridad de coordenadas
     * 
     * GET /api/rutas/seguridad?lat=6.24&lng=-75.58
     */
    @GetMapping("/seguridad")
    public ResponseEntity<?> evaluarSeguridad(
            @RequestParam Double lat,
            @RequestParam Double lng) {

        // Calcular ruta mínima (100m alrededor del punto)
        double offset = 0.001; // ~100m
        RutaDTO ruta = rutaService.calcularRuta(
                lat - offset, lng - offset,
                lat + offset, lng + offset);

        int score = rutaService.evaluarSeguridadRuta(ruta);

        return ResponseEntity.ok(java.util.Map.of(
                "seguridadScore", score,
                "reportesCercanos", ruta.getReportesCercanos(),
                "seguro", score >= 80));
    }
}
