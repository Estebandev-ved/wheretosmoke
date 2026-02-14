package com.medallo_map.wheretosmoke.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Comentario;

/**
 * REPOSITORIO DE COMENTARIOS
 */
@Repository
public interface ComentarioRepository extends JpaRepository<Comentario, Long> {

    // Obtener comentarios de un spot (más recientes primero)
    List<Comentario> findBySpotIdOrderByFechaDesc(Long spotId);

    // Contar comentarios de un spot
    int countBySpotId(Long spotId);

    // Obtener comentarios de un usuario
    List<Comentario> findByUsuarioId(Long usuarioId);

    // Contar comentarios de un usuario
    int countByUsuarioId(Long usuarioId);
}
