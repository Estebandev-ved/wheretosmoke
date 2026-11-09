package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.model.SelloComuna;

@Repository
public interface SelloComunaRepository extends JpaRepository<SelloComuna, Long> {

    List<SelloComuna> findByUsuarioId(Long usuarioId);

    /** 1 si el sello se otorgó ahora, 0 si el usuario ya lo tenía (atómico). */
    @Transactional
    @Modifying
    @Query(value = "INSERT IGNORE INTO sellos_comuna (usuario_id, comuna, fecha) VALUES (:usuario, :comuna, :fecha)", nativeQuery = true)
    int otorgarSiNoExiste(@Param("usuario") Long usuario, @Param("comuna") String comuna,
            @Param("fecha") LocalDateTime fecha);
}
