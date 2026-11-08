package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.MisionUsuario;

@Repository
public interface MisionUsuarioRepository extends JpaRepository<MisionUsuario, Long> {

    Optional<MisionUsuario> findByUsuarioIdAndMisionIdAndPeriodo(Long usuarioId, Long misionId, LocalDate periodo);

    List<MisionUsuario> findByUsuarioIdAndPeriodoIn(Long usuarioId, Collection<LocalDate> periodos);

    /**
     * Marca como reclamada de forma atómica. Devuelve 1 solo para la primera
     * petición; cualquier reintento/doble clic recibe 0 y no se paga de nuevo.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE MisionUsuario m SET m.reclamada = true WHERE m.id = :id AND m.completada = true AND m.reclamada = false")
    int marcarReclamada(@Param("id") Long id);
}
