package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ARTÍCULO COMPRADO POR UN USUARIO.
 * La restricción única (usuario, artículo) impide comprar dos veces aunque haya peticiones concurrentes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tienda_inventario", uniqueConstraints = @UniqueConstraint(name = "uk_inventario_usuario_articulo", columnNames = {
        "usuario_id", "articulo_id" }))
public class InventarioUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "articulo_id", nullable = false)
    private ArticuloTienda articulo;

    @Builder.Default
    @Column(nullable = false)
    private boolean equipado = false;

    @Column(name = "fecha_compra", nullable = false)
    private LocalDateTime fechaCompra;
}
