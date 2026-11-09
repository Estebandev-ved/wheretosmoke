package com.medallo_map.wheretosmoke.service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

/**
 * COMUNAS Y CORREGIMIENTOS DE MEDELLÍN (clase pura, sin Spring ni BD).
 *
 * Asignación por aproximación: se elige el centro más cercano (distancia haversine) de una tabla
 * estática de 16 comunas y 5 corregimientos. Es una aproximación (no usa polígonos oficiales):
 * los spots cerca de un límite entre comunas pueden caer en la vecina. Las coordenadas son
 * centros aproximados. Si el punto queda a más de DISTANCIA_MAX_KM del centro más cercano,
 * no se asigna comuna (null).
 */
public final class ComunasMedellin {

    public record Comuna(String nombre, double lat, double lng) {
    }

    public static final double DISTANCIA_MAX_KM = 15.0;

    public static final List<Comuna> TODAS = List.of(
            new Comuna("Popular", 6.2960, -75.5430),
            new Comuna("Santa Cruz", 6.2970, -75.5560),
            new Comuna("Manrique", 6.2750, -75.5460),
            new Comuna("Aranjuez", 6.2850, -75.5580),
            new Comuna("Castilla", 6.2910, -75.5740),
            new Comuna("Doce de Octubre", 6.3050, -75.5680),
            new Comuna("Robledo", 6.2850, -75.5930),
            new Comuna("Villa Hermosa", 6.2570, -75.5470),
            new Comuna("Buenos Aires", 6.2400, -75.5500),
            new Comuna("La Candelaria", 6.2476, -75.5658),
            new Comuna("Laureles-Estadio", 6.2530, -75.5920),
            new Comuna("La América", 6.2560, -75.6030),
            new Comuna("San Javier", 6.2560, -75.6190),
            new Comuna("El Poblado", 6.2090, -75.5650),
            new Comuna("Guayabal", 6.2200, -75.5900),
            new Comuna("Belén", 6.2300, -75.6050),
            // Corregimientos
            new Comuna("San Sebastián de Palmitas", 6.3500, -75.6900),
            new Comuna("San Cristóbal", 6.2800, -75.6350),
            new Comuna("Altavista", 6.2200, -75.6300),
            new Comuna("San Antonio de Prado", 6.1850, -75.6550),
            new Comuna("Santa Elena", 6.2100, -75.5000));

    private ComunasMedellin() {
    }

    /** Nombre de la comuna más cercana, o null si faltan coordenadas o el punto queda muy lejos. */
    public static String asignar(Double lat, Double lng) {
        if (lat == null || lng == null || lat.isNaN() || lng.isNaN()) {
            return null;
        }
        Comuna mejor = null;
        double mejorKm = Double.MAX_VALUE;
        for (Comuna c : TODAS) {
            double km = distanciaKm(lat, lng, c.lat(), c.lng());
            if (km < mejorKm) {
                mejorKm = km;
                mejor = c;
            }
        }
        return mejor != null && mejorKm <= DISTANCIA_MAX_KM ? mejor.nombre() : null;
    }

    public static boolean existe(String nombre) {
        return TODAS.stream().anyMatch(c -> c.nombre().equals(nombre));
    }

    /** Distancia haversine en kilómetros. */
    static double distanciaKm(double lat1, double lng1, double lat2, double lng2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * r * Math.asin(Math.sqrt(a));
    }

    /** Identificador estable para el cliente: "El Poblado" -> "SELLO_EL_POBLADO". */
    public static String sello(String comuna) {
        String sinTildes = Normalizer.normalize(comuna, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return "SELLO_" + sinTildes.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
    }
}
