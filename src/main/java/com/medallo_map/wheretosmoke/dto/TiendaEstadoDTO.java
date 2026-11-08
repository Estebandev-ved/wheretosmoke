package com.medallo_map.wheretosmoke.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Estado completo del usuario en la tienda: saldo, nivel, inventario y qué tiene equipado por categoría. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TiendaEstadoDTO {
    private int monedas;
    private int nivel;
    private List<ArticuloTiendaDTO> inventario;
    /** categoría (SKIN, MARCO...) -> artículo equipado. */
    private Map<String, ArticuloTiendaDTO> equipados;
}
