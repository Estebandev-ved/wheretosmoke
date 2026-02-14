package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.medallo_map.wheretosmoke.model.ChatMensaje;

public interface ChatRepository extends JpaRepository<ChatMensaje, Long> {

    // Obtener mensajes recientes de un spot (ultimas 2 horas)
    @Query("SELECT c FROM ChatMensaje c WHERE c.spotId = :spotId " +
            "AND c.timestamp > :cutoffTime ORDER BY c.timestamp ASC")
    List<ChatMensaje> findMensajesRecientesBySpot(@Param("spotId") Long spotId,
            @Param("cutoffTime") LocalDateTime cutoffTime);

    // Eliminar mensajes viejos (mas de 2 horas)
    @Modifying
    @Query("DELETE FROM ChatMensaje c WHERE c.timestamp < :cutoffTime")
    void eliminarMensajesViejos(@Param("cutoffTime") LocalDateTime cutoffTime);

    // Contar mensajes activos en un spot
    @Query("SELECT COUNT(c) FROM ChatMensaje c WHERE c.spotId = :spotId " +
            "AND c.timestamp > :cutoffTime")
    Long contarMensajesActivos(@Param("spotId") Long spotId,
            @Param("cutoffTime") LocalDateTime cutoffTime);
}
