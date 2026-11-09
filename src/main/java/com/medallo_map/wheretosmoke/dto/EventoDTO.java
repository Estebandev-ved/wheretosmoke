package com.medallo_map.wheretosmoke.dto;

import java.time.Clock;
import java.time.format.DateTimeFormatter;

import com.medallo_map.wheretosmoke.service.ReglasGamificacion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Estado de la hora feliz 4:20 (público). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventoDTO {
    private boolean activo;
    private int multiplicador;
    /** Segundos para que termine la hora feliz en curso (0 si no hay una activa). */
    private long segundosRestantes;
    /** Segundos hasta el inicio de la próxima hora feliz. */
    private long segundosParaProxima;
    /** Inicio de la próxima hora feliz, ISO-8601 con offset (America/Bogota). */
    private String proximaInicioIso;

    public static EventoDTO de(Clock clock) {
        return EventoDTO.builder()
                .activo(ReglasGamificacion.horaFelizActiva(clock))
                .multiplicador(ReglasGamificacion.multiplicadorEvento(clock))
                .segundosRestantes(ReglasGamificacion.segundosRestantesHoraFeliz(clock))
                .segundosParaProxima(ReglasGamificacion.segundosParaProximaHoraFeliz(clock))
                .proximaInicioIso(ReglasGamificacion.proximoInicioHoraFeliz(clock)
                        .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .build();
    }
}
