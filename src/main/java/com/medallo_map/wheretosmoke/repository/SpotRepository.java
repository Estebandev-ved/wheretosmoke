package com.medallo_map.wheretosmoke.repository;

import java.util.List;

import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Spot;

@Repository
public interface SpotRepository extends JpaRepository<Spot, Long> {

    // BUSCAR SPOTS CERCANOS CON POSTGIS
    // Utiliza ST_Distance_Sphere para calcular distancias geodesicas en metros
    // Mucho mas eficiente que la formula Haversine manual gracias al indice
    // espacial
    // Parametros:
    // - point: ubicacion del usuario (tipo Point)
    // - radius: radio de busqueda en metros
    @Query(value = "SELECT * FROM spots s WHERE ST_Distance_Sphere(s.location, :point) <= :radius ORDER BY ST_Distance_Sphere(s.location, :point) ASC", nativeQuery = true)
    List<Spot> findCercanos(@Param("point") Point point, @Param("radius") double radius);

    // MEJORES CALIFICADOS
    // Ordena por calificacion promedio de mayor a menor
    @Query("SELECT s FROM Spot s ORDER BY s.calificacionPromedio DESC")
    List<Spot> findMejores(Pageable pageable);

    // TRENDING SPOTS
    // Ordena por actividad total (suma de votos tombo + relax)
    // Los spots con mas interaccion reciente aparecen primero
    @Query(value = "SELECT * FROM spots ORDER BY (votos_tombo + votos_relax) DESC", nativeQuery = true)
    List<Spot> findTrending(Pageable pageable);
}
