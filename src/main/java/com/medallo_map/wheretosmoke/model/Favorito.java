package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MODELO DE FAVORITO
 * 
 * Spots marcados como favoritos por usuarios.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "favoritos")
public class Favorito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Usuario
    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    // Spot favorito
    @Column(name = "spot_id", nullable = false)
    private Long spotId;

    // Fecha en que se agregó
    @Column(name = "fecha_agregado")
    private LocalDateTime fechaAgregado;

    // Recibir notificaciones de este spot
    @Column(name = "notificaciones_activas")
    @Builder.Default
    private Boolean notificacionesActivas = true;
}
