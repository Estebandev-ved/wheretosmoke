package com.medallo_map.wheretosmoke.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.TransaccionMonedas;

@Repository
public interface TransaccionMonedasRepository extends JpaRepository<TransaccionMonedas, Long> {

    boolean existsByUsuarioIdAndMotivoAndReferencia(Long usuarioId, String motivo, String referencia);
}
