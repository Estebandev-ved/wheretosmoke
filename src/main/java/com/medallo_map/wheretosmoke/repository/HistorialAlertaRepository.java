package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.HistorialAlerta;

/**
 * REPOSITORIO DE HISTORIAL DE ALERTAS
 */
@Repository
public interface HistorialAlertaRepository extends JpaRepository<HistorialAlerta, Long> {

    // Obtener historial de un spot (últimas 50)
    List<HistorialAlerta> findTop50BySpotIdOrderByTimestampDesc(Long spotId);

    // Obtener alertas de la última semana para análisis
    @Query("SELECT h FROM HistorialAlerta h WHERE h.spotId = :spotId AND h.timestamp > :desde ORDER BY h.timestamp DESC")
    List<HistorialAlerta> findAlertasRecientes(@Param("spotId") Long spotId, @Param("desde") LocalDateTime desde);

    // Contar alertas por día de la semana para un spot
    @Query("SELECT h.diaSemana, COUNT(h) FROM HistorialAlerta h WHERE h.spotId = :spotId AND h.tipoAlerta = 'TOMBO' GROUP BY h.diaSemana ORDER BY h.diaSemana")
    List<Object[]> contarAlertasPorDia(@Param("spotId") Long spotId);

    // Contar alertas por hora para un spot
    @Query("SELECT h.horaDia, COUNT(h) FROM HistorialAlerta h WHERE h.spotId = :spotId AND h.tipoAlerta = 'TOMBO' GROUP BY h.horaDia ORDER BY h.horaDia")
    List<Object[]> contarAlertasPorHora(@Param("spotId") Long spotId);

    // Obtener total de alertas TOMBO de un spot
    int countBySpotIdAndTipoAlerta(Long spotId, String tipoAlerta);

    // Contar todas las alertas por tipo (para estadísticas admin)
    long countByTipoAlerta(String tipoAlerta);
}
