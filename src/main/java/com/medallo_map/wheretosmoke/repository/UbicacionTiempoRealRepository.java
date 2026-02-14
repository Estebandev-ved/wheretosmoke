package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.medallo_map.wheretosmoke.model.UbicacionTiempoReal;

public interface UbicacionTiempoRealRepository extends JpaRepository<UbicacionTiempoReal, Long> {

    // Buscar ubicacion activa de un usuario en un circulo
    Optional<UbicacionTiempoReal> findByUsuarioIdAndCirculoId(Long usuarioId, Long circuloId);

    // Buscar todas las ubicaciones activas de un circulo
    List<UbicacionTiempoReal> findByCirculoId(Long circuloId);

    // Eliminar ubicaciones viejas (mas de 1 hora sin actualizar)
    @Modifying
    @Query("DELETE FROM UbicacionTiempoReal u WHERE u.timestamp < :cutoffTime")
    void eliminarUbicacionesViejas(@Param("cutoffTime") LocalDateTime cutoffTime);

    // Eliminar ubicacion de un usuario en un circulo
    @Modifying
    @Query("DELETE FROM UbicacionTiempoReal u WHERE u.usuarioId = :usuarioId AND u.circuloId = :circuloId")
    void eliminarUbicacion(@Param("usuarioId") Long usuarioId, @Param("circuloId") Long circuloId);
}
