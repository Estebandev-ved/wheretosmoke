package com.medallo_map.wheretosmoke.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medallo_map.wheretosmoke.dto.GeoZonaDTO;
import com.medallo_map.wheretosmoke.dto.GeoZonaPublicaDTO;
import com.medallo_map.wheretosmoke.dto.GeoZonaRequest;
import com.medallo_map.wheretosmoke.model.GeoZona;
import com.medallo_map.wheretosmoke.repository.GeoZonaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 🗺️ SERVICE - GeoZona
 * 
 * Maneja la lógica de validación geográfica
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeoZonaService {

    private final GeoZonaRepository geoZonaRepository;
    private final ObjectMapper objectMapper;

    // Límites de Medellín (bounding box)
    private static final double MEDELLIN_LAT_MIN = 6.1;
    private static final double MEDELLIN_LAT_MAX = 6.4;
    private static final double MEDELLIN_LNG_MIN = -75.7;
    private static final double MEDELLIN_LNG_MAX = -75.5;

    /**
     * Verifica si un punto está dentro de Medellín
     */
    public boolean puntoEnMedellin(double lat, double lng) {
        return lat >= MEDELLIN_LAT_MIN && lat <= MEDELLIN_LAT_MAX &&
                lng >= MEDELLIN_LNG_MIN && lng <= MEDELLIN_LNG_MAX;
    }

    /**
     * Verifica si un punto está en alguna zona activa
     */
    public boolean puntoEnZonaPermitida(double lat, double lng) {
        List<GeoZona> zonasActivas = geoZonaRepository.findByActivaTrueOrderByOrdenAsc();

        for (GeoZona zona : zonasActivas) {
            if (puntoEnPoligono(lat, lng, zona.getPoligonoJson())) {
                log.debug("Punto ({}, {}) está en zona: {}", lat, lng, zona.getNombre());
                return true;
            }
        }

        log.debug("Punto ({}, {}) NO está en ninguna zona activa", lat, lng);
        return false;
    }

    /**
     * Algoritmo Ray Casting para verificar si un punto está dentro de un polígono
     * 
     * @param lat          Latitud del punto
     * @param lng          Longitud del punto
     * @param poligonoJson Polígono en formato GeoJSON
     * @return true si el punto está dentro del polígono
     */
    public boolean puntoEnPoligono(double lat, double lng, String poligonoJson) {
        try {
            JsonNode root = objectMapper.readTree(poligonoJson);
            JsonNode coordinates = root.get("coordinates").get(0); // Primera ring del polígono

            int numVertices = coordinates.size();
            double[] verticesLat = new double[numVertices];
            double[] verticesLng = new double[numVertices];

            // Extraer vértices
            for (int i = 0; i < numVertices; i++) {
                JsonNode vertex = coordinates.get(i);
                verticesLng[i] = vertex.get(0).asDouble(); // GeoJSON: [lng, lat]
                verticesLat[i] = vertex.get(1).asDouble();
            }

            // Ray Casting Algorithm
            boolean inside = false;
            int j = numVertices - 1;

            for (int i = 0; i < numVertices; j = i++) {
                if (((verticesLat[i] > lat) != (verticesLat[j] > lat)) &&
                        (lng < (verticesLng[j] - verticesLng[i]) * (lat - verticesLat[i]) /
                                (verticesLat[j] - verticesLat[i]) + verticesLng[i])) {
                    inside = !inside;
                }
            }

            return inside;

        } catch (Exception e) {
            log.error("Error parseando polígono: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Obtener todas las zonas activas (para usuarios)
     */
    public List<GeoZonaPublicaDTO> obtenerZonasActivas() {
        return geoZonaRepository.findByActivaTrueOrderByOrdenAsc()
                .stream()
                .map(this::convertirAPublicaDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener todas las zonas (para admin)
     */
    public List<GeoZonaDTO> obtenerTodasLasZonas() {
        return geoZonaRepository.findAllByOrderByOrdenAsc()
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener zona por ID
     */
    public GeoZonaDTO obtenerZonaPorId(Long id) {
        GeoZona zona = geoZonaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada"));
        return convertirADTO(zona);
    }

    /**
     * Crear nueva zona
     */
    @Transactional
    public GeoZonaDTO crearZona(GeoZonaRequest request) {
        GeoZona zona = GeoZona.builder()
                .nombre(request.getNombre())
                .tipo(request.getTipo())
                .poligonoJson(request.getPoligonoJson())
                .activa(request.getActiva() != null ? request.getActiva() : false)
                .color(request.getColor() != null ? request.getColor() : "#00C851")
                .descripcion(request.getDescripcion())
                .orden(request.getOrden())
                .build();

        GeoZona guardada = geoZonaRepository.save(zona);
        log.info("Zona creada: {}", guardada.getNombre());

        return convertirADTO(guardada);
    }

    /**
     * Actualizar zona
     */
    @Transactional
    public GeoZonaDTO actualizarZona(Long id, GeoZonaRequest request) {
        GeoZona zona = geoZonaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada"));

        zona.setNombre(request.getNombre());
        zona.setTipo(request.getTipo());
        zona.setPoligonoJson(request.getPoligonoJson());
        zona.setActiva(request.getActiva());
        zona.setColor(request.getColor());
        zona.setDescripcion(request.getDescripcion());
        zona.setOrden(request.getOrden());

        GeoZona actualizada = geoZonaRepository.save(zona);
        log.info("Zona actualizada: {}", actualizada.getNombre());

        return convertirADTO(actualizada);
    }

    /**
     * Activar zona
     */
    @Transactional
    public GeoZonaDTO activarZona(Long id) {
        GeoZona zona = geoZonaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada"));

        zona.setActiva(true);
        zona.setFechaActivacion(LocalDateTime.now());

        GeoZona actualizada = geoZonaRepository.save(zona);
        log.info("Zona activada: {}", actualizada.getNombre());

        return convertirADTO(actualizada);
    }

    /**
     * Desactivar zona
     */
    @Transactional
    public GeoZonaDTO desactivarZona(Long id) {
        GeoZona zona = geoZonaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada"));

        zona.setActiva(false);

        GeoZona actualizada = geoZonaRepository.save(zona);
        log.info("Zona desactivada: {}", actualizada.getNombre());

        return convertirADTO(actualizada);
    }

    /**
     * Eliminar zona
     */
    @Transactional
    public void eliminarZona(Long id) {
        geoZonaRepository.deleteById(id);
        log.info("Zona eliminada: ID {}", id);
    }

    /**
     * Obtener estadísticas
     */
    public long contarZonasActivas() {
        return geoZonaRepository.countZonasActivas();
    }

    // ===== CONVERSORES =====

    private GeoZonaDTO convertirADTO(GeoZona zona) {
        return GeoZonaDTO.builder()
                .id(zona.getId())
                .nombre(zona.getNombre())
                .tipo(zona.getTipo())
                .poligonoJson(zona.getPoligonoJson())
                .activa(zona.getActiva())
                .color(zona.getColor())
                .fechaActivacion(zona.getFechaActivacion())
                .fechaCreacion(zona.getFechaCreacion())
                .descripcion(zona.getDescripcion())
                .orden(zona.getOrden())
                .totalSpots(zona.getTotalSpots())
                .build();
    }

    private GeoZonaPublicaDTO convertirAPublicaDTO(GeoZona zona) {
        return GeoZonaPublicaDTO.builder()
                .id(zona.getId())
                .nombre(zona.getNombre())
                .tipo(zona.getTipo())
                .poligonoJson(zona.getPoligonoJson())
                .color(zona.getColor())
                .descripcion(zona.getDescripcion())
                .build();
    }
}
