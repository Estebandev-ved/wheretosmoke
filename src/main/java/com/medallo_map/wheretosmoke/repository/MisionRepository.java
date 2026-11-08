package com.medallo_map.wheretosmoke.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.AccionMision;
import com.medallo_map.wheretosmoke.model.Mision;

@Repository
public interface MisionRepository extends JpaRepository<Mision, Long> {

    boolean existsByCodigo(String codigo);

    List<Mision> findByActivaTrueOrderByTipoAscIdAsc();

    List<Mision> findByAccionAndActivaTrue(AccionMision accion);
}
