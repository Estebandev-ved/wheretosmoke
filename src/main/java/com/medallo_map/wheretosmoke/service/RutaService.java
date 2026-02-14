package com.medallo_map.wheretosmoke.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.medallo_map.wheretosmoke.dto.RutaDTO;
import com.medallo_map.wheretosmoke.model.Reporte;
import com.medallo_map.wheretosmoke.repository.ReporteRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RutaService {

    private final ReporteRepository reporteRepository;
    private final RestTemplate restTemplate = new RestTemplate(); // Para llamar a OSRM

    // API Pública de OSRM (Open Source Routing Machine)
    private static final String OSRM_API_URL = "http://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson";

    private static final double RADIO_PELIGRO_METROS = 200.0; // Radio de alerta

    public RutaDTO calcularRuta(Double origenLat, Double origenLng,
            Double destinoLat, Double destinoLng) {

        // 1. Obtener reportes policiales recientes (últimas 2 horas)
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        List<Reporte> reportesActivos = reporteRepository.findReportesPoliciales(cutoff);

        // 2. Intentar obtener ruta real por calles (OSRM)
        List<RutaDTO.Coordenada> puntosRuta;
        double distanciaTotal = 0;
        double tiempoTotal = 0;

        try {
            // OSRM usa long,lat en la URL, no lat,long. Formato:
            // {lon1},{lat1};{lon2},{lat2}
            // Usamos Locale.US para asegurar que los decimales usen punto (.) y no coma (,)
            String url = String.format(java.util.Locale.US, OSRM_API_URL, origenLng, origenLat, destinoLng, destinoLat);

            log.info("Consultando OSRM: {}", url);
            OsrmResponse response = restTemplate.getForObject(url, OsrmResponse.class);

            if (response != null && response.routes != null && !response.routes.isEmpty()) {
                OsrmRoute rutaOsrm = response.routes.get(0);

                // Convertir coordenadas OSRM (long, lat) a nuestro DTO (lat, long)
                puntosRuta = rutaOsrm.geometry.coordinates.stream()
                        .map(coord -> new RutaDTO.Coordenada(coord.get(1), coord.get(0)))
                        .collect(Collectors.toList());

                distanciaTotal = rutaOsrm.distance;
                tiempoTotal = rutaOsrm.duration;
                log.info("Ruta OSRM obtenida: {} puntos, {}m, {}s", puntosRuta.size(), distanciaTotal, tiempoTotal);
            } else {
                throw new RuntimeException("No se encontró ruta en OSRM");
            }

        } catch (Exception e) {
            log.error("Error obteniendo ruta OSRM, usando línea recta: {}", e.getMessage());
            // Fallback a línea recta si falla OSRM
            puntosRuta = calcularRutaDirecta(origenLat, origenLng, destinoLat, destinoLng);
            distanciaTotal = calcularDistanciaHaversine(origenLat, origenLng, destinoLat, destinoLng);
            tiempoTotal = (distanciaTotal / 1000.0) / 40.0 * 3600; // Est. 40km/h
        }

        // 3. Evaluar seguridad en la ruta detallada
        List<RutaDTO.ReporteInfo> reportesCercanos = new ArrayList<>();

        // Optimización: Revisar cada reporte contra la ruta
        // (En un sistema real usaríamos índices espaciales, aquí iteramos puntos clave)
        // Reducimos puntos de la ruta para no iterar demasiado (cada ~10 puntos)
        List<RutaDTO.Coordenada> puntosMuestreo = new ArrayList<>();
        for (int i = 0; i < puntosRuta.size(); i += Math.max(1, puntosRuta.size() / 50)) {
            puntosMuestreo.add(puntosRuta.get(i));
        }

        for (Reporte reporte : reportesActivos) {
            if (reporte.getLocation() == null)
                continue;

            boolean esPeligroso = puntosMuestreo.stream().anyMatch(punto -> {
                double dist = calcularDistanciaHaversine(
                        punto.getLatitud(), punto.getLongitud(),
                        reporte.getLatitud(), reporte.getLongitud());
                return dist <= RADIO_PELIGRO_METROS;
            });

            if (esPeligroso) {
                reportesCercanos.add(RutaDTO.ReporteInfo.builder()
                        .id(reporte.getId())
                        .tipo(reporte.getTipo())
                        .latitud(reporte.getLatitud())
                        .longitud(reporte.getLongitud())
                        .timestamp(reporte.getFechaCreacion().toString())
                        .build());
            }
        }

        return RutaDTO.builder()
                .ruta(puntosRuta)
                .distanciaMetros(distanciaTotal)
                .tiempoSegundos((long) tiempoTotal)
                .reportesCercanos(reportesCercanos.size())
                .reportes(reportesCercanos)
                .build();
    }

    private List<RutaDTO.Coordenada> calcularRutaDirecta(Double lat1, Double lon1, Double lat2, Double lon2) {
        List<RutaDTO.Coordenada> ruta = new ArrayList<>();
        ruta.add(new RutaDTO.Coordenada(lat1, lon1));

        int pasos = 10;
        for (int i = 1; i < pasos; i++) {
            double nuevaLat = lat1 + (lat2 - lat1) * i / pasos;
            double nuevaLng = lon1 + (lon2 - lon1) * i / pasos;
            ruta.add(new RutaDTO.Coordenada(nuevaLat, nuevaLng));
        }

        ruta.add(new RutaDTO.Coordenada(lat2, lon2));
        return ruta;
    }

    private double calcularDistanciaHaversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public int evaluarSeguridadRuta(RutaDTO ruta) {
        if (ruta.getReportesCercanos() == 0)
            return 100;
        int score = 100 - (ruta.getReportesCercanos() * 20);
        return Math.max(0, score);
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class OsrmResponse {
        private List<OsrmRoute> routes;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class OsrmRoute {
        private OsrmGeometry geometry;
        private double distance;
        private double duration;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class OsrmGeometry {
        private List<List<Double>> coordinates;
        private String type;
    }
}
