package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Avance del álbum de una comuna para el usuario autenticado. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumComunaDTO {
    private String comuna;
    private int totalSpots;
    private int visitados;
    /** true si ya ganó el sello o, hoy, visitó todos los spots (mínimo 3 spots en la comuna). */
    private boolean completa;
    /** Identificador del sello (p. ej. SELLO_EL_POBLADO). */
    private String sello;
}
