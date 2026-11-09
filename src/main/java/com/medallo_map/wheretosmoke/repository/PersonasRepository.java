package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.medallo_map.wheretosmoke.model.SelloComuna;
import com.medallo_map.wheretosmoke.model.Usuario;

/**
 * Consultas agrupadas para sugerencias de personas y actividad de amigos. Cada una resuelve un lote completo
 * (IN + GROUP BY) para que los servicios no hagan N+1. Las nativas usan SQL de MySQL.
 */
public interface PersonasRepository extends Repository<Usuario, Long> {

    /** [otroUsuarioId, cuántos de mis amigos lo son también] para todos los amigos de mis amigos. */
    @Query(value = "SELECT t.otro, COUNT(*) FROM (SELECT CASE WHEN a.usuario_menor IN (:amigos) "
            + "THEN a.usuario_mayor ELSE a.usuario_menor END AS otro FROM amistades a WHERE a.estado = 'ACEPTADA' "
            + "AND (a.usuario_menor IN (:amigos) OR a.usuario_mayor IN (:amigos))) t GROUP BY t.otro",
            nativeQuery = true)
    List<Object[]> amigosEnComunDeTodos(@Param("amigos") Collection<Long> amigos);

    /** Igual que arriba pero solo para los {@code ids} indicados (para páginas ya resueltas). */
    @Query(value = "SELECT t.otro, COUNT(*) FROM (SELECT CASE WHEN a.usuario_menor IN (:amigos) "
            + "THEN a.usuario_mayor ELSE a.usuario_menor END AS otro FROM amistades a WHERE a.estado = 'ACEPTADA' "
            + "AND (a.usuario_menor IN (:amigos) OR a.usuario_mayor IN (:amigos))) t "
            + "WHERE t.otro IN (:ids) GROUP BY t.otro", nativeQuery = true)
    List<Object[]> amigosEnComunCon(@Param("amigos") Collection<Long> amigos, @Param("ids") Collection<Long> ids);

    /** [usuarioId, circuloId] de los miembros activos de esos círculos (sin mí). */
    @Query(value = "SELECT m.usuario_id, m.circulo_id FROM miembros_circulo m "
            + "WHERE m.activo = 1 AND m.circulo_id IN (:circulos) AND m.usuario_id <> :yo", nativeQuery = true)
    List<Object[]> miembrosDeCirculos(@Param("circulos") Collection<Long> circulos, @Param("yo") Long yo);

    /** Comunas donde el usuario tiene visitas desde {@code desde}. */
    @Query(value = "SELECT DISTINCT s.comuna FROM visitas_spot v JOIN spots s ON s.id = v.spot_id "
            + "WHERE v.usuario_id = :yo AND v.dia >= :desde AND s.comuna IS NOT NULL", nativeQuery = true)
    List<String> comunasRecientes(@Param("yo") Long yo, @Param("desde") LocalDate desde);

    /** [usuarioId, comuna] de otras personas con visitas recientes en esas comunas. */
    @Query(value = "SELECT v.usuario_id, s.comuna FROM visitas_spot v JOIN spots s ON s.id = v.spot_id "
            + "WHERE v.dia >= :desde AND s.comuna IN (:comunas) AND v.usuario_id <> :yo "
            + "GROUP BY v.usuario_id, s.comuna", nativeQuery = true)
    List<Object[]> usuariosEnComunas(@Param("yo") Long yo, @Param("comunas") Collection<String> comunas,
            @Param("desde") LocalDate desde);

    // ── Actividad de amigos ──────────────────────────────────────────────────

    /** [spotId, nombre, creadorId, fecha] de spots creados por esas personas (fecha = su primera visita). */
    @Query(value = "SELECT s.id, s.nombre, s.creador_id, MIN(v.fecha) AS f FROM spots s "
            + "JOIN visitas_spot v ON v.spot_id = s.id AND v.usuario_id = s.creador_id "
            + "WHERE s.creador_id IN (:ids) AND v.fecha IS NOT NULL "
            + "GROUP BY s.id, s.nombre, s.creador_id ORDER BY f DESC LIMIT :limite", nativeQuery = true)
    List<Object[]> spotsCreados(@Param("ids") Collection<Long> ids, @Param("limite") int limite);

    @Query("SELECT s FROM SelloComuna s WHERE s.usuarioId IN :ids AND s.fecha IS NOT NULL ORDER BY s.fecha DESC")
    List<SelloComuna> sellosRecientes(@Param("ids") Collection<Long> ids, Pageable pageable);

    /** [fotoId, usuarioId, spotId, fecha] sin cargar la imagen. */
    @Query("SELECT f.id, f.usuarioId, f.spotId, f.fechaSubida FROM Foto f "
            + "WHERE f.usuarioId IN :ids AND f.fechaSubida IS NOT NULL ORDER BY f.fechaSubida DESC")
    List<Object[]> fotosRecientes(@Param("ids") Collection<Long> ids, Pageable pageable);
}
