package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.model.VisitaSpot;

@Repository
public interface VisitaSpotRepository extends JpaRepository<VisitaSpot, Long> {

    /** Inserta la visita si no existe (usuario, spot, día). Devuelve 1 si era nueva, 0 si ya estaba. */
    @Transactional
    @Modifying
    @Query(value = "INSERT IGNORE INTO visitas_spot (usuario_id, spot_id, dia, fecha) "
            + "VALUES (:usuario, :spot, :dia, :fecha)", nativeQuery = true)
    int registrarSiNoExiste(@Param("usuario") Long usuario, @Param("spot") Long spot,
            @Param("dia") LocalDate dia, @Param("fecha") LocalDateTime fecha);

    /** [comuna, spots distintos visitados por el usuario] */
    @Query(value = "SELECT s.comuna, COUNT(DISTINCT v.spot_id) FROM visitas_spot v "
            + "JOIN spots s ON s.id = v.spot_id "
            + "WHERE v.usuario_id = :usuario AND s.comuna IS NOT NULL GROUP BY s.comuna", nativeQuery = true)
    List<Object[]> visitadosPorComuna(@Param("usuario") Long usuario);

    @Query(value = "SELECT COUNT(DISTINCT v.spot_id) FROM visitas_spot v "
            + "JOIN spots s ON s.id = v.spot_id "
            + "WHERE v.usuario_id = :usuario AND s.comuna = :comuna", nativeQuery = true)
    long contarVisitadosEnComuna(@Param("usuario") Long usuario, @Param("comuna") String comuna);

    /**
     * Usuarios activos por comuna desde una fecha: [comuna, usuarioId, username, puntos].
     * Una sola consulta para todo el ranking.
     */
    @Query(value = "SELECT s.comuna, u.id, u.username, COALESCE(u.puntos, 0) FROM visitas_spot v "
            + "JOIN spots s ON s.id = v.spot_id JOIN usuarios u ON u.id = v.usuario_id "
            + "WHERE v.dia >= :desde AND s.comuna IS NOT NULL AND u.activo = 1 "
            + "GROUP BY s.comuna, u.id, u.username, u.puntos", nativeQuery = true)
    List<Object[]> usuariosActivosPorComuna(@Param("desde") LocalDate desde);

    /** Visitas de los miembros activos de un círculo entre dos fechas (ambas inclusive). */
    @Query(value = "SELECT COUNT(*) FROM visitas_spot v WHERE v.dia BETWEEN :desde AND :hasta "
            + "AND v.usuario_id IN (SELECT m.usuario_id FROM miembros_circulo m "
            + "WHERE m.circulo_id = :circulo AND m.activo = 1)", nativeQuery = true)
    long contarVisitasMiembros(@Param("circulo") Long circulo, @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta);
}
