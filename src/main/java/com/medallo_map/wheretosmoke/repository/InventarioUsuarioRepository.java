package com.medallo_map.wheretosmoke.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.CategoriaArticulo;
import com.medallo_map.wheretosmoke.model.InventarioUsuario;

@Repository
public interface InventarioUsuarioRepository extends JpaRepository<InventarioUsuario, Long> {

    List<InventarioUsuario> findByUsuarioId(Long usuarioId);

    /** Artículos equipados de varios usuarios en una sola consulta (listas sociales sin N+1). */
    @org.springframework.data.jpa.repository.Query("SELECT i FROM InventarioUsuario i JOIN FETCH i.articulo "
            + "WHERE i.usuarioId IN :ids AND i.equipado = true")
    List<InventarioUsuario> findEquipadosDe(
            @org.springframework.data.repository.query.Param("ids") java.util.Collection<Long> ids);

    Optional<InventarioUsuario> findByUsuarioIdAndArticuloId(Long usuarioId, Long articuloId);

    boolean existsByUsuarioIdAndArticuloId(Long usuarioId, Long articuloId);

    List<InventarioUsuario> findByUsuarioIdAndArticuloCategoria(Long usuarioId, CategoriaArticulo categoria);
}
