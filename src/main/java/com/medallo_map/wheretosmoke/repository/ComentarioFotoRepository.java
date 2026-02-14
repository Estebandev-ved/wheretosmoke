package com.medallo_map.wheretosmoke.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.ComentarioFoto;

/**
 * REPOSITORIO DE COMENTARIOS EN FOTOS
 */
@Repository
public interface ComentarioFotoRepository extends JpaRepository<ComentarioFoto, Long> {

    // Obtener comentarios de una foto ordenados por fecha
    List<ComentarioFoto> findByFotoIdOrderByFechaDesc(Long fotoId);

    // Contar comentarios de una foto
    int countByFotoId(Long fotoId);
}
