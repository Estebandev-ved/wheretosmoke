package com.medallo_map.wheretosmoke.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Estado de las reacciones de una foto tras reaccionar. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReaccionFotoDTO {
    private Long fotoId;
    /** Emoji actual del usuario o null si quitó su reacción. */
    private String miReaccion;
    /** Conteo por emoji (siempre los 5 permitidos). */
    private Map<String, Integer> reacciones;
}
