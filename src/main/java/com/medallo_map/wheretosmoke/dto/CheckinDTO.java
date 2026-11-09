package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Resultado del check-in diario. Si yaHecho=true no se pagó nada (idempotente). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinDTO {
    private boolean yaHecho;
    private int rachaDias;
    private int monedasGanadas;
    private int xpGanado;
    private int monedas;
    private int puntos;
    private int nivel;
    /** Monedas que dará el check-in de mañana si se mantiene la racha. */
    private int bonoManana;
    /** 2 si el check-in se hizo en hora feliz 4:20, 1 si no. */
    private int multiplicador;
}
