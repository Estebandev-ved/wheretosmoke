package com.medallo_map.wheretosmoke.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.medallo_map.wheretosmoke.model.CategoriaSpot;
import com.medallo_map.wheretosmoke.model.Spot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO DETALLADO DE SPOT
 * 
 * Incluye toda la información del spot: fotos, comentarios, calificaciones,
 * historial.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpotDetalleDTO {

    // Información básica del spot
    private Long id;
    private String nombre;
    private String descripcion;
    private Double latitud;
    private Double longitud;
    private String estado;
    private LocalDateTime ultimaAlerta;
    private CategoriaSpot categoria;
    private String horarioRecomendado;

    // Calificaciones
    private Double calificacionPromedio;
    private Integer totalCalificaciones;
    private CalificacionesDetalleDTO calificacionesDetalle;

    // Fotos
    private List<FotoDTO> fotos;
    private Integer totalFotos;

    // Comentarios
    private List<ComentarioDTO> comentarios;
    private Integer totalComentarios;

    // Historial de alertas
    private List<HistorialAlertaDTO> historialAlertas;
    private PatronesAlertaDTO patronesAlerta;

    // Favoritos
    private Boolean esFavorito;
    private Integer totalFavoritos;

    // Información del creador
    private Long creadorId;
    private String creadorNombre;

    // Votos actuales
    private Integer votosTombo;
    private Integer votosRelax;
    private Boolean yaVoto;
    private String mensajeEstado;

    /**
     * Crear DTO desde entidad Spot
     */
    public static SpotDetalleDTO fromSpot(Spot spot) {
        return SpotDetalleDTO.builder()
                .id(spot.getId())
                .nombre(spot.getNombre())
                .descripcion(spot.getDescripcion())
                .latitud(spot.getLatitud())
                .longitud(spot.getLongitud())
                .estado(spot.getEstado())
                .ultimaAlerta(spot.getUltimaAlerta())
                .categoria(spot.getCategoria())
                .horarioRecomendado(spot.getHorarioRecomendado())
                .calificacionPromedio(spot.getCalificacionPromedio())
                .totalFotos(spot.getCantidadFotos())
                .totalComentarios(spot.getCantidadComentarios())
                .creadorId(spot.getCreadorId())
                .build();
    }
}
