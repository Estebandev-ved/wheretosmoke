package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.model.ReclamoMetaCirculo;

@Repository
public interface ReclamoMetaCirculoRepository extends JpaRepository<ReclamoMetaCirculo, Long> {

    boolean existsByCirculoIdAndUsuarioIdAndSemana(Long circuloId, Long usuarioId, LocalDate semana);

    /** 1 si el reclamo se registró ahora, 0 si ya existía (atómico). */
    @Transactional
    @Modifying
    @Query(value = "INSERT IGNORE INTO reclamos_meta_circulo (circulo_id, usuario_id, semana, fecha) "
            + "VALUES (:circulo, :usuario, :semana, :fecha)", nativeQuery = true)
    int registrarSiNoExiste(@Param("circulo") Long circulo, @Param("usuario") Long usuario,
            @Param("semana") LocalDate semana, @Param("fecha") LocalDateTime fecha);
}
