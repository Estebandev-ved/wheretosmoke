package com.medallo_map.wheretosmoke.repository;

import com.medallo_map.wheretosmoke.model.GeoZona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * REPOSITORY - GeoZona
 */
@Repository
public interface GeoZonaRepository extends JpaRepository<GeoZona, Long> {

    /**
     * Obtener todas las zonas activas
     */
    List<GeoZona> findByActivaTrueOrderByOrdenAsc();

    /**
     * Obtener zonas ordenadas
     */
    List<GeoZona> findAllByOrderByOrdenAsc();

    /**
     * Buscar por nombre
     */
    List<GeoZona> findByNombreContainingIgnoreCase(String nombre);

    /**
     * Contar zonas activas
     */
    @Query("SELECT COUNT(z) FROM GeoZona z WHERE z.activa = true")
    long countZonasActivas();
}
