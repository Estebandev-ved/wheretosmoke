package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "spots")
public class Spot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    // COORDENADAS GEOESPACIALES
    // Usamos tipo Point de PostGIS para aprovechar indices espaciales
    // SRID 4326 = WGS84 (sistema de coordenadas GPS estandar)
    // Esto permite hacer queries de proximidad mucho mas eficientes
    // Nota: En MariaDB el SRID se establece via ST_PointFromText, no en el DDL
    // @JsonIgnore evita que Jackson intente serializar este objeto directamente
    @JsonIgnore
    @Column(columnDefinition = "POINT")
    private Point location;

    // Campos transient para recibir lat/long desde JSON
    // Jackson llamara setLatitud() y setLongitud() durante la deserializacion
    // Una vez ambos esten seteados, crearemos el Point en setCoordinates()
    private transient Double tempLatitud;
    private transient Double tempLongitud;

    // Factory para crear objetos Point (necesario para JTS)
    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    // Metodos helper para mantener compatibilidad con codigo existente
    // Estos permiten obtener/setear lat/long individualmente
    public Double getLatitud() {
        if (location != null) {
            return location.getY();
        }
        return tempLatitud;
    }

    public Double getLongitud() {
        if (location != null) {
            return location.getX();
        }
        return tempLongitud;
    }

    public void setLatitud(Double latitud) {
        this.tempLatitud = latitud;
        // Si ya tenemos longitud, crear el Point automaticamente
        if (tempLongitud != null && latitud != null) {
            this.location = geometryFactory.createPoint(
                    new Coordinate(tempLongitud, latitud));
        }
    }

    public void setLongitud(Double longitud) {
        this.tempLongitud = longitud;
        // Si ya tenemos latitud, crear el Point automaticamente
        if (tempLatitud != null && longitud != null) {
            this.location = geometryFactory.createPoint(
                    new Coordinate(longitud, tempLatitud));
        }
    }

    // Metodo conveniente para setear ambas coordenadas a la vez
    public void setCoordinates(Double latitud, Double longitud) {
        this.tempLatitud = latitud;
        this.tempLongitud = longitud;
        if (latitud != null && longitud != null) {
            this.location = geometryFactory.createPoint(
                    new Coordinate(longitud, latitud));
        }
    }

    // Estado visual: "VERDE" (Chill) o "ROJO" (Tombo)
    private String estado;

    // Momento exacto del último reporte de policía
    private LocalDateTime ultimaAlerta;

    // Descripción corta del usuario
    @Column(length = 500) // Permitimos hasta 500 caracteres
    private String descripcion;

    // CATEGORÍA DEL SPOT
    @Enumerated(EnumType.STRING)
    @Column(name = "categoria")
    private CategoriaSpot categoria;

    // HORARIO RECOMENDADO (ej: "8pm - 11pm", "Todo el día")
    @Column(name = "horario_recomendado", length = 100)
    private String horarioRecomendado;

    // CALIFICACIÓN PROMEDIO (calculada)
    @Column(name = "calificacion_promedio")
    private Double calificacionPromedio;

    // CANTIDAD DE FOTOS
    @Column(name = "cantidad_fotos")
    private Integer cantidadFotos = 0;

    // CANTIDAD DE COMENTARIOS
    @Column(name = "cantidad_comentarios")
    private Integer cantidadComentarios = 0;

    // CONTADORES DE VOTOS (para trending y estadisticas)
    @Column(name = "votos_tombo")
    private Integer votosTombo = 0;

    @Column(name = "votos_relax")
    private Integer votosRelax = 0;

    // ID DEL CREADOR = DESCUBRIDOR del spot (lo fija el servidor al crear)
    @Column(name = "creador_id")
    private Long creadorId;

    // COMUNA / CORREGIMIENTO de Medellín (asignada por el servidor, ver ComunasMedellin)
    @Column(name = "comuna", length = 60)
    private String comuna;

    // Username del descubridor (no se guarda; se rellena al responder)
    @jakarta.persistence.Transient
    private String descubridorNombre;
}
