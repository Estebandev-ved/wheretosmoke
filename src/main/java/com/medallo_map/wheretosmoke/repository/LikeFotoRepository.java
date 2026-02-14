package com.medallo_map.wheretosmoke.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.LikeFoto;

/**
 * REPOSITORIO DE LIKES EN FOTOS
 */
@Repository
public interface LikeFotoRepository extends JpaRepository<LikeFoto, Long> {

    // Buscar si un usuario ya dio like a una foto
    Optional<LikeFoto> findByFotoIdAndUsuarioId(Long fotoId, Long usuarioId);

    // Verificar si existe el like
    boolean existsByFotoIdAndUsuarioId(Long fotoId, Long usuarioId);

    // Contar likes de una foto
    int countByFotoId(Long fotoId);
}
