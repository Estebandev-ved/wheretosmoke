package com.medallo_map.wheretosmoke.dto;

import java.time.LocalDateTime;

import com.medallo_map.wheretosmoke.model.HistorialAlerta;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO DE HISTORIAL DE ALERTA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistorialAlertaDTO {
    private Long id;
    private String tipoAlerta;
    private LocalDateTime timestamp;
    private Integer diaSemana;
    private Integer horaDia;

    public static HistorialAlertaDTO fromHistorialAlerta(HistorialAlerta h) {
        return HistorialAlertaDTO.builder()
                .id(h.getId())
                .tipoAlerta(h.getTipoAlerta())
                .timestamp(h.getTimestamp())
                .diaSemana(h.getDiaSemana())
                .horaDia(h.getHoraDia())
                .build();
    }
}
