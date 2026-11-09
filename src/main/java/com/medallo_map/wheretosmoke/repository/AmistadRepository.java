package com.medallo_map.wheretosmoke.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Amistad;
import com.medallo_map.wheretosmoke.model.EstadoAmistad;

@Repository
public interface AmistadRepository extends JpaRepository<Amistad, Long> {

    Optional<Amistad> findByUsuarioMenorAndUsuarioMayor(Long menor, Long mayor);

    /** Amistades aceptadas del usuario, las más recientes primero. */
    @Query("SELECT a FROM Amistad a WHERE a.estado = :estado AND (a.usuarioMenor = :u OR a.usuarioMayor = :u) "
            + "ORDER BY a.fechaAmistad DESC, a.id DESC")
    List<Amistad> findAmigos(@Param("u") Long usuarioId, @Param("estado") EstadoAmistad estado);

    @Query("SELECT COUNT(a) FROM Amistad a WHERE a.estado = :estado AND (a.usuarioMenor = :u OR a.usuarioMayor = :u)")
    long contarAmigos(@Param("u") Long usuarioId, @Param("estado") EstadoAmistad estado);

    /** Solicitudes pendientes que el usuario recibió (otra persona las envió). */
    @Query("SELECT a FROM Amistad a WHERE a.estado = :estado AND a.solicitanteId <> :u "
            + "AND (a.usuarioMenor = :u OR a.usuarioMayor = :u) ORDER BY a.fechaSolicitud DESC")
    List<Amistad> findRecibidas(@Param("u") Long usuarioId, @Param("estado") EstadoAmistad estado);

    List<Amistad> findBySolicitanteIdAndEstadoOrderByFechaSolicitudDesc(Long solicitanteId, EstadoAmistad estado);

    long countBySolicitanteIdAndEstado(Long solicitanteId, EstadoAmistad estado);

    /** Relaciones (pendientes o aceptadas) del usuario con un conjunto de personas, en una sola consulta. */
    @Query("SELECT a FROM Amistad a WHERE (a.usuarioMenor = :u AND a.usuarioMayor IN :otros) "
            + "OR (a.usuarioMayor = :u AND a.usuarioMenor IN :otros)")
    List<Amistad> findRelacionesCon(@Param("u") Long usuarioId, @Param("otros") Collection<Long> otros);

    /** Borra la fila del par (amistad o solicitud). Devuelve las filas borradas (idempotente). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Amistad a WHERE a.usuarioMenor = :menor AND a.usuarioMayor = :mayor")
    int borrarPar(@Param("menor") Long menor, @Param("mayor") Long mayor);

    /** Borra el par solo si es una amistad ya aceptada. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Amistad a WHERE a.usuarioMenor = :menor AND a.usuarioMayor = :mayor AND a.estado = :estado")
    int borrarParConEstado(@Param("menor") Long menor, @Param("mayor") Long mayor,
            @Param("estado") EstadoAmistad estado);
}
