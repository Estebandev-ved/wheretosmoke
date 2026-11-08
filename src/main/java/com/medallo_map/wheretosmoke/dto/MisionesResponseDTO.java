package com.medallo_map.wheretosmoke.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Misiones del periodo vigente con segundos hasta el próximo reinicio. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MisionesResponseDTO {
    private List<MisionDTO> diarias;
    private List<MisionDTO> semanales;
    private long segundosReinicioDiario;
    private long segundosReinicioSemanal;
}
