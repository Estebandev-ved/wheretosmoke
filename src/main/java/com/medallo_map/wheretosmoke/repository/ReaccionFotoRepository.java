package com.medallo_map.wheretosmoke.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.ReaccionFoto;

@Repository
public interface ReaccionFotoRepository extends JpaRepository<ReaccionFoto, Long> {

    Optional<ReaccionFoto> findByFotoIdAndUsuarioId(Long fotoId, Long usuarioId);

    List<ReaccionFoto> findByUsuarioIdAndFotoIdIn(Long usuarioId, Collection<Long> fotoIds);

    /** [fotoId, codigo, cantidad] para varias fotos en una sola consulta. */
    @Query("SELECT r.fotoId, r.codigo, COUNT(r) FROM ReaccionFoto r WHERE r.fotoId IN :ids GROUP BY r.fotoId, r.codigo")
    List<Object[]> contarPorFoto(@Param("ids") Collection<Long> ids);
}
