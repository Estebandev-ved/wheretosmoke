package com.medallo_map.wheretosmoke.dto;

import com.medallo_map.wheretosmoke.model.AccionMision;
import com.medallo_map.wheretosmoke.model.TipoMision;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MisionDTO {
    private Long id;
    private String codigo;
    private String titulo;
    private String descripcion;
    private TipoMision tipo;
    private AccionMision accion;
    private int meta;
    private int progreso;
    private boolean completada;
    private boolean reclamada;
    private int recompensaXp;
    private int recompensaMonedas;
}
