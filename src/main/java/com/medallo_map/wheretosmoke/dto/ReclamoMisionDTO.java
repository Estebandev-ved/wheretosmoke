package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReclamoMisionDTO {
    private Long misionId;
    private String codigo;
    private int xpGanado;
    private int monedasGanadas;
    private int monedas;
    private int puntos;
    private int nivel;
    private boolean subioNivel;
    /** 2 si se reclamó en hora feliz 4:20, 1 si no (xpGanado y monedasGanadas ya lo incluyen). */
    private int multiplicador;
}
