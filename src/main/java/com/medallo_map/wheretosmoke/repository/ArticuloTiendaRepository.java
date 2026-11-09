package com.medallo_map.wheretosmoke.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.ArticuloTienda;
import com.medallo_map.wheretosmoke.model.CategoriaArticulo;

@Repository
public interface ArticuloTiendaRepository extends JpaRepository<ArticuloTienda, Long> {

    List<ArticuloTienda> findByActivoTrueAndRarezaInAndPrecioGreaterThan(
            java.util.Collection<com.medallo_map.wheretosmoke.model.RarezaArticulo> rarezas, int precioMin);

    boolean existsByCodigo(String codigo);

    List<ArticuloTienda> findByActivoTrueOrderByPrecioAscIdAsc();

    List<ArticuloTienda> findByActivoTrueAndCategoriaOrderByPrecioAscIdAsc(CategoriaArticulo categoria);
}
