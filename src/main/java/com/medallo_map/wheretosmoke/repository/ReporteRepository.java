package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Reporte;

/**
 * REPOSITORIO DE REPORTES
 * 
 * Aqui definimos consultas especiales para trabajar con los votos:
 * - Contar votos por tipo (TOMBO/RELAX)
 * - Verificar si un usuario ya voto
 * - Limpiar votos antiguos
 * - Encontrar reportes de policia activos (para rutas de bajo perfil)
 */
@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

        /**
         * Cuenta cuantos votos de un tipo especifico hay para un spot
         * en un periodo de tiempo (ultimas 2 horas)
         * 
         * Ejemplo: Cuantos votos "TOMBO" hay para el spot #5 desde las 3pm?
         */
        @Query("SELECT COUNT(r) FROM Reporte r WHERE r.spotId = :spotId " +
                        "AND r.tipoReporte = :tipo AND r.timestamp >= :desde")
        int contarVotosPorTipo(
                        @Param("spotId") Long spotId,
                        @Param("tipo") String tipo,
                        @Param("desde") LocalDateTime desde);

        /**
         * Verifica si un usuario (fingerprint) ya voto en este spot recientemente
         * 
         * Retorna true si el usuario ya tiene un voto activo (ultimas 2 horas)
         */
        @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reporte r " +
                        "WHERE r.spotId = :spotId AND r.userFingerprint = :fingerprint " +
                        "AND r.timestamp >= :desde")
        boolean usuarioYaVoto(
                        @Param("spotId") Long spotId,
                        @Param("fingerprint") String fingerprint,
                        @Param("desde") LocalDateTime desde);

        /**
         * Encuentra todos los reportes viejos (mas de 2 horas) para limpiarlos
         * Esto se ejecutara periodicamente para mantener la base de datos limpia
         */
        List<Reporte> findByTimestampBefore(LocalDateTime fecha);

        /**
         * Obtener todos los reportes de un spot especifico
         * Util para debugging o para mostrar historial
         */
        List<Reporte> findBySpotId(Long spotId);

        /**
         * BUSCAR REPORTES DE POLICIA ACTIVOS (Para rutas de bajo perfil)
         * 
         * Encuentra todos los reportes tipo "TOMBO" creados en las ultimas 2 horas
         * que tengan ubicacion geografica almacenada.
         * 
         * Esto se usa para el algoritmo de rutas de bajo perfil:
         * Las rutas que pasen cerca de estos reportes tendran un "costo" extra,
         * haciendo que GraphHopper prefiera rutas alternativas.
         * 
         * @param tipoReporte: "TOMBO" (reportes de policia)
         * @param desde:       Timestamp minimo (ej: hace 2 horas)
         * @return Lista de reportes activos con ubicacion
         */
        @Query("SELECT r FROM Reporte r WHERE r.tipoReporte = :tipoReporte " +
                        "AND r.timestamp >= :desde AND r.location IS NOT NULL")
        List<Reporte> findReportesActivosConUbicacion(
                        @Param("tipoReporte") String tipoReporte,
                        @Param("desde") LocalDateTime desde);

        /**
         * Shortcut para obtener reportes policiales recientes
         */
        @Query("SELECT r FROM Reporte r WHERE r.tipoReporte = 'TOMBO' " +
                        "AND r.timestamp >= :desde AND r.location IS NOT NULL")
        List<Reporte> findReportesPoliciales(@Param("desde") LocalDateTime desde);
}
