package com.medallo_map.wheretosmoke.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.medallo_map.wheretosmoke.dto.ArticuloTiendaDTO;
import com.medallo_map.wheretosmoke.dto.TiendaEstadoDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.CategoriaArticulo;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.TiendaService;

import lombok.RequiredArgsConstructor;

/**
 * 🛍️ TIENDA DE COSMÉTICOS (monedas del juego).
 * El catálogo es público (con flags de usuario si envía token); todo lo demás requiere login.
 */
@RestController
@RequestMapping("/api/tienda")
@RequiredArgsConstructor
public class TiendaController {

    private final TiendaService tiendaService;

    /** GET /api/tienda/articulos?categoria=SKIN */
    @GetMapping("/articulos")
    public ResponseEntity<List<ArticuloTiendaDTO>> articulos(
            @RequestParam(required = false) String categoria,
            @AuthenticationPrincipal Usuario usuario) {
        CategoriaArticulo cat = null;
        if (categoria != null && !categoria.isBlank()) {
            try {
                cat = CategoriaArticulo.valueOf(categoria.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new NegocioException(HttpStatus.BAD_REQUEST, "Categoría inválida: " + categoria);
            }
        }
        return ResponseEntity.ok(tiendaService.listarArticulos(usuario != null ? usuario.getId() : null, cat));
    }

    /** GET /api/tienda/inventario */
    @GetMapping("/inventario")
    public ResponseEntity<TiendaEstadoDTO> inventario(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(tiendaService.obtenerEstado(requerir(usuario)));
    }

    /** POST /api/tienda/comprar/{articuloId} */
    @PostMapping("/comprar/{articuloId}")
    public ResponseEntity<TiendaEstadoDTO> comprar(@PathVariable Long articuloId,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(tiendaService.comprar(requerir(usuario), articuloId));
    }

    /** POST /api/tienda/equipar/{articuloId} */
    @PostMapping("/equipar/{articuloId}")
    public ResponseEntity<TiendaEstadoDTO> equipar(@PathVariable Long articuloId,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(tiendaService.equipar(requerir(usuario), articuloId));
    }

    /** POST /api/tienda/desequipar/{articuloId} */
    @PostMapping("/desequipar/{articuloId}")
    public ResponseEntity<TiendaEstadoDTO> desequipar(@PathVariable Long articuloId,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(tiendaService.desequipar(requerir(usuario), articuloId));
    }

    private Long requerir(Usuario usuario) {
        if (usuario == null) {
            throw new NegocioException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión");
        }
        return usuario.getId();
    }
}
