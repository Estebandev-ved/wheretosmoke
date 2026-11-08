package com.medallo_map.wheretosmoke.dto;

import com.medallo_map.wheretosmoke.model.ArticuloTienda;
import com.medallo_map.wheretosmoke.model.CategoriaArticulo;
import com.medallo_map.wheretosmoke.model.RarezaArticulo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticuloTiendaDTO {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private CategoriaArticulo categoria;
    private RarezaArticulo rareza;
    private int precio;
    private int nivelRequerido;
    private String imagen;
    private boolean destacado;
    private boolean comprado;
    private boolean equipado;
    private boolean bloqueadoPorNivel;

    public static ArticuloTiendaDTO de(ArticuloTienda a, boolean comprado, boolean equipado, boolean bloqueado) {
        return ArticuloTiendaDTO.builder()
                .id(a.getId()).codigo(a.getCodigo()).nombre(a.getNombre())
                .descripcion(a.getDescripcion()).categoria(a.getCategoria()).rareza(a.getRareza())
                .precio(a.getPrecio()).nivelRequerido(a.getNivelRequerido()).imagen(a.getImagen())
                .destacado(a.isDestacado())
                .comprado(comprado).equipado(equipado).bloqueadoPorNivel(bloqueado)
                .build();
    }
}
