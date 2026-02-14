package com.medallo_map.wheretosmoke.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.medallo_map.wheretosmoke.model.CirculoConfianza;

public interface CirculoConfianzaRepository extends JpaRepository<CirculoConfianza, Long> {

    // Buscar circulo por codigo de invitacion
    Optional<CirculoConfianza> findByCodigoInvitacion(String codigoInvitacion);

    // Buscar circulos creados por un usuario
    List<CirculoConfianza> findByCreadorIdAndActivoTrue(Long creadorId);

    // Buscar circulos donde un usuario es miembro
    @Query("SELECT c FROM CirculoConfianza c " +
            "JOIN MiembroCirculo m ON m.circuloId = c.id " +
            "WHERE m.usuarioId = :usuarioId AND m.activo = true AND c.activo = true")
    List<CirculoConfianza> findCirculosByUsuario(@Param("usuarioId") Long usuarioId);
}
