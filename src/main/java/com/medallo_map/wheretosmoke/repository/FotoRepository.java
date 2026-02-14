package com.medallo_map.wheretosmoke.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Foto;

/**
 * REPOSITORIO DE FOTOS
 */
@Repository
public interface FotoRepository extends JpaRepository<Foto, Long> {

    // Obtener fotos de un spot
    List<Foto> findBySpotIdOrderByFechaSubidaDesc(Long spotId);

    // Contar fotos de un spot
    int countBySpotId(Long spotId);

    // Obtener fotos de un usuario
    List<Foto> findByUsuarioId(Long usuarioId);

    // Contar fotos de un usuario
    int countByUsuarioId(Long usuarioId);
}
