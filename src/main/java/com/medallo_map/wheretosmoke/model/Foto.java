package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 📸 MODELO DE FOTO
 * 
 * Almacena fotos de los spots subidas por usuarios.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "fotos")
public class Foto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Spot al que pertenece la foto
    @Column(name = "spot_id", nullable = false)
    private Long spotId;

    // Usuario que subió la foto
    @Column(name = "usuario_id")
    private Long usuarioId;

    // Datos de la imagen en Base64
    @Column(name = "image_data", columnDefinition = "LONGTEXT")
    private String imageData;

    // Descripción opcional de la foto
    @Column(length = 200)
    private String descripcion;

    // Fecha de subida
    @Column(name = "fecha_subida")
    private LocalDateTime fechaSubida;

    // Cantidad de likes
    @Column(name = "likes")
    @Builder.Default
    private Integer likes = 0;
}
