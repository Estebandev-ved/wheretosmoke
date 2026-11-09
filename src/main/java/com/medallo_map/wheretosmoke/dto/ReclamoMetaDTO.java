package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Resultado de reclamar el cofre de la meta del círculo. yaReclamado=true: no se pagó nada. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReclamoMetaDTO {
    private boolean yaReclamado;
    private int monedasGanadas;
    private int xpGanado;
    private int saldoMonedas;
    private int puntos;
    private int nivel;
    private boolean subioNivel;
}
