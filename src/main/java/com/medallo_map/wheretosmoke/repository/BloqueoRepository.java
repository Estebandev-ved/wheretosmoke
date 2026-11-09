package com.medallo_map.wheretosmoke.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Bloqueo;

@Repository
public interface BloqueoRepository extends JpaRepository<Bloqueo, Long> {

    boolean existsByBloqueadorIdAndBloqueadoId(Long bloqueadorId, Long bloqueadoId);

    List<Bloqueo> findByBloqueadorIdOrderByFechaDesc(Long bloqueadorId);

    /** true si hay bloqueo en cualquiera de los dos sentidos. */
    @Query("SELECT COUNT(b) > 0 FROM Bloqueo b WHERE (b.bloqueadorId = :a AND b.bloqueadoId = :b) "
            + "OR (b.bloqueadorId = :b AND b.bloqueadoId = :a)")
    boolean existeEntre(@Param("a") Long a, @Param("b") Long b);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Bloqueo b WHERE b.bloqueadorId = :bloqueador AND b.bloqueadoId = :bloqueado")
    int borrar(@Param("bloqueador") Long bloqueador, @Param("bloqueado") Long bloqueado);

    /** Ids de las personas que yo bloqueé. */
    @Query("SELECT b.bloqueadoId FROM Bloqueo b WHERE b.bloqueadorId = :yo")
    List<Long> idsBloqueadosPor(@Param("yo") Long yo);

    /** Ids de las personas que me bloquearon. */
    @Query("SELECT b.bloqueadorId FROM Bloqueo b WHERE b.bloqueadoId = :yo")
    List<Long> idsQueMeBloquearon(@Param("yo") Long yo);
}
