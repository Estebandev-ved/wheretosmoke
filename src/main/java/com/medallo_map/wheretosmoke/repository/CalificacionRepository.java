package com.medallo_map.wheretosmoke.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Calificacion;

/**
 * REPOSITORIO DE CALIFICACIONES
 */
@Repository
public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {

    // Obtener calificaciones de un spot
    List<Calificacion> findBySpotId(Long spotId);

    // Verificar si un usuario ya calificó un spot
    Optional<Calificacion> findBySpotIdAndUsuarioId(Long spotId, Long usuarioId);

    // Calcular promedio de estrellas de un spot
    @Query("SELECT AVG(c.estrellas) FROM Calificacion c WHERE c.spotId = :spotId")
    Double calcularPromedioEstrellas(@Param("spotId") Long spotId);

    // Calcular promedios por aspecto
    @Query("SELECT AVG(c.privacidad), AVG(c.ambiente), AVG(c.vista), AVG(c.accesibilidad) FROM Calificacion c WHERE c.spotId = :spotId")
    Object[] calcularPromediosAspectos(@Param("spotId") Long spotId);

    // Contar calificaciones de un spot
    int countBySpotId(Long spotId);
}
