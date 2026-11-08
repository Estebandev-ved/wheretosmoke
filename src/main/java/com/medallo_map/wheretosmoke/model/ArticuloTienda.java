package com.medallo_map.wheretosmoke.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** COSMÉTICO VIRTUAL de la tienda. Solo se compra con monedas del juego. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tienda_articulos")
public class ArticuloTienda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String codigo;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 300)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoriaArticulo categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RarezaArticulo rareza;

    /** Precio en monedas (>= 0). */
    @Column(nullable = false)
    private int precio;

    @Builder.Default
    @Column(name = "nivel_requerido", nullable = false)
    private int nivelRequerido = 1;

    /** Ruta del asset existente en cliente-mapa (ej. /icons/bud_angry.png). */
    @Column(length = 200)
    private String imagen;

    @Builder.Default
    @Column(nullable = false)
    private boolean activo = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean destacado = false;
}
