package com.medallo_map.wheretosmoke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO PARA ALERTAS EN TIEMPO REAL
 * 
 * Se envía por WebSocket cuando hay una nueva alerta.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AlertaDTO {
    private Long spotId;
    private String spotNombre;
    private Double latitud;
    private Double longitud;
    private String tipoAlerta; // "TOMBO" o "RELAX"
    private String mensaje;
    private String timestamp;
}
