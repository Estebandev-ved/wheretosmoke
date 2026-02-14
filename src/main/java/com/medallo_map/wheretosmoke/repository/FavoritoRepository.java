package com.medallo_map.wheretosmoke.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Favorito;

/**
 * REPOSITORIO DE FAVORITOS
 */
@Repository
public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    // Obtener favoritos de un usuario
    List<Favorito> findByUsuarioIdOrderByFechaAgregadoDesc(Long usuarioId);

    // Verificar si un spot es favorito de un usuario
    Optional<Favorito> findByUsuarioIdAndSpotId(Long usuarioId, Long spotId);

    // Verificar existencia (más eficiente)
    boolean existsByUsuarioIdAndSpotId(Long usuarioId, Long spotId);

    // Eliminar favorito
    void deleteByUsuarioIdAndSpotId(Long usuarioId, Long spotId);

    // Obtener usuarios que tienen un spot como favorito (para notificaciones)
    @Query("SELECT f.usuarioId FROM Favorito f WHERE f.spotId = :spotId AND f.notificacionesActivas = true")
    List<Long> findUsuariosConNotificaciones(@Param("spotId") Long spotId);

    // Contar cuántos usuarios tienen un spot como favorito
    int countBySpotId(Long spotId);
}
