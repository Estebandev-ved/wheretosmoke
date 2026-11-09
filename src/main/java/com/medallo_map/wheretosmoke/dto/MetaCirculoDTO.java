package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Meta semanal cooperativa de un círculo. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetaCirculoDTO {
    private int progreso;
    private int objetivo;
    private boolean completada;
    /** true si la meta está completa y el usuario que consulta aún no reclamó su cofre esta semana. */
    private boolean reclamosPendientes;
    private boolean yaReclamado;
    private int miembros;
    private int recompensaMonedas;
    private int recompensaXp;
    private long segundosRestantes;
}
