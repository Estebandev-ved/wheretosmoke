package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Resultado de abrir el cofre diario. Si yaAbierto=true no hay premio (idempotente). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CofreDTO {
    private boolean yaAbierto;
    /** MONEDAS, XP o ARTICULO (null si yaAbierto). */
    private String tipo;
    private int monedas;
    private int xp;
    private ArticuloTiendaDTO articulo;
    private int saldoMonedas;
    private int puntos;
    private int nivel;
    private boolean subioNivel;
    /** 2 si se abrió en hora feliz 4:20 (monedas y xp ya lo incluyen). */
    private int multiplicador;
    private long segundosParaSiguiente;
}
