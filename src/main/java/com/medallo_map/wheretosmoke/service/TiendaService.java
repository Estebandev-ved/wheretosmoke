package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.ArticuloTiendaDTO;
import com.medallo_map.wheretosmoke.dto.TiendaEstadoDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.ArticuloTienda;
import com.medallo_map.wheretosmoke.model.CategoriaArticulo;
import com.medallo_map.wheretosmoke.model.InventarioUsuario;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.ArticuloTiendaRepository;
import com.medallo_map.wheretosmoke.repository.InventarioUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * TIENDA DE COSMÉTICOS VIRTUALES (solo monedas del juego, sin dinero real).
 *
 * Reglas de compra: artículo activo, nivel suficiente, no comprado antes y saldo suficiente.
 * Anti doble gasto: el cobro es un UPDATE atómico condicionado al saldo (MonedasService) y la
 * restricción única (usuario, artículo) del inventario frena compras duplicadas concurrentes;
 * todo ocurre en una sola transacción, por lo que si algo falla se revierte completo.
 */
@Service
@RequiredArgsConstructor
public class TiendaService {

    private final ArticuloTiendaRepository articuloRepository;
    private final InventarioUsuarioRepository inventarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final MonedasService monedasService;
    private final Clock clock;

    /** Catálogo activo. usuarioId puede ser null (visitante): los flags salen en false. */
    @Transactional(readOnly = true)
    public List<ArticuloTiendaDTO> listarArticulos(Long usuarioId, CategoriaArticulo categoria) {
        List<ArticuloTienda> articulos = categoria == null
                ? articuloRepository.findByActivoTrueOrderByPrecioAscIdAsc()
                : articuloRepository.findByActivoTrueAndCategoriaOrderByPrecioAscIdAsc(categoria);

        int nivel = 1;
        Set<Long> comprados = new HashSet<>();
        Set<Long> equipados = new HashSet<>();
        if (usuarioId != null) {
            nivel = nivelDe(usuarioRepository.findById(usuarioId).orElse(null));
            for (InventarioUsuario i : inventarioRepository.findByUsuarioId(usuarioId)) {
                comprados.add(i.getArticulo().getId());
                if (i.isEquipado()) {
                    equipados.add(i.getArticulo().getId());
                }
            }
        }
        List<ArticuloTiendaDTO> resultado = new ArrayList<>();
        for (ArticuloTienda a : articulos) {
            resultado.add(ArticuloTiendaDTO.de(a, comprados.contains(a.getId()), equipados.contains(a.getId()),
                    nivel < a.getNivelRequerido()));
        }
        return resultado;
    }

    @Transactional(readOnly = true)
    public TiendaEstadoDTO obtenerEstado(Long usuarioId) {
        Usuario usuario = cargarUsuario(usuarioId);
        return construirEstado(usuario);
    }

    @Transactional
    public TiendaEstadoDTO comprar(Long usuarioId, Long articuloId) {
        Usuario usuario = cargarUsuario(usuarioId);
        ArticuloTienda articulo = articuloRepository.findById(articuloId)
                .filter(ArticuloTienda::isActivo)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Artículo no disponible"));

        int nivel = nivelDe(usuario);
        if (nivel < articulo.getNivelRequerido()) {
            throw new NegocioException(HttpStatus.FORBIDDEN,
                    "Necesitas nivel " + articulo.getNivelRequerido() + " para comprar este artículo (eres nivel "
                            + nivel + ")");
        }
        if (inventarioRepository.existsByUsuarioIdAndArticuloId(usuarioId, articuloId)) {
            throw new NegocioException(HttpStatus.CONFLICT, "Ya tienes este artículo");
        }
        Integer saldo = usuarioRepository.obtenerMonedas(usuarioId);
        if ((saldo == null ? 0 : saldo) < articulo.getPrecio()) {
            throw new NegocioException(HttpStatus.PAYMENT_REQUIRED, "No tienes monedas suficientes");
        }

        // Primero el inventario (la restricción única frena duplicados concurrentes),
        // luego el cobro atómico. Cualquier fallo revierte ambos.
        inventarioRepository.saveAndFlush(InventarioUsuario.builder()
                .usuarioId(usuarioId).articulo(articulo).equipado(false)
                .fechaCompra(LocalDateTime.now(clock)).build());
        if (articulo.getPrecio() > 0) {
            monedasService.debitar(usuarioId, articulo.getPrecio(), "COMPRA", articulo.getCodigo());
        }
        return construirEstado(cargarUsuario(usuarioId));
    }

    /** Equipa un artículo comprado y desequipa los demás de su categoría. */
    @Transactional
    public TiendaEstadoDTO equipar(Long usuarioId, Long articuloId) {
        Usuario usuario = usuarioRepository.findByIdForUpdate(usuarioId)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        InventarioUsuario item = inventarioRepository.findByUsuarioIdAndArticuloId(usuarioId, articuloId)
                .orElseThrow(() -> new NegocioException(HttpStatus.BAD_REQUEST, "No tienes este artículo"));

        List<InventarioUsuario> categoria = inventarioRepository.findByUsuarioIdAndArticuloCategoria(usuarioId,
                item.getArticulo().getCategoria());
        for (InventarioUsuario otro : categoria) {
            otro.setEquipado(otro.getArticulo().getId().equals(articuloId));
        }
        inventarioRepository.saveAll(categoria);
        return construirEstado(usuario);
    }

    @Transactional
    public TiendaEstadoDTO desequipar(Long usuarioId, Long articuloId) {
        Usuario usuario = usuarioRepository.findByIdForUpdate(usuarioId)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        InventarioUsuario item = inventarioRepository.findByUsuarioIdAndArticuloId(usuarioId, articuloId)
                .orElseThrow(() -> new NegocioException(HttpStatus.BAD_REQUEST, "No tienes este artículo"));
        item.setEquipado(false);
        inventarioRepository.save(item);
        return construirEstado(usuario);
    }

    // ── auxiliares ──

    private Usuario cargarUsuario(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private int nivelDe(Usuario usuario) {
        return usuario == null ? 1 : ReglasGamificacion.nivelPara(usuario.getPuntos());
    }

    private TiendaEstadoDTO construirEstado(Usuario usuario) {
        Long id = usuario.getId();
        int nivel = nivelDe(usuario);
        Integer saldo = usuarioRepository.obtenerMonedas(id);

        List<ArticuloTiendaDTO> inventario = new ArrayList<>();
        Map<String, ArticuloTiendaDTO> equipados = new LinkedHashMap<>();
        for (InventarioUsuario i : inventarioRepository.findByUsuarioId(id)) {
            ArticuloTienda a = i.getArticulo();
            ArticuloTiendaDTO dto = ArticuloTiendaDTO.de(a, true, i.isEquipado(), nivel < a.getNivelRequerido());
            inventario.add(dto);
            if (i.isEquipado()) {
                equipados.put(a.getCategoria().name(), dto);
            }
        }
        return TiendaEstadoDTO.builder()
                .monedas(saldo == null ? 0 : saldo)
                .nivel(nivel)
                .inventario(inventario)
                .equipados(equipados)
                .build();
    }
}
