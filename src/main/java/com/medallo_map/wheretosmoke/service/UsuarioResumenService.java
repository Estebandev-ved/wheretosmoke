package com.medallo_map.wheretosmoke.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.medallo_map.wheretosmoke.dto.SocialDTO.UsuarioMini;
import com.medallo_map.wheretosmoke.model.InventarioUsuario;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.InventarioUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/** Carga en lote los datos públicos de varias personas (usuario + cosméticos equipados) sin N+1. */
@Service
@RequiredArgsConstructor
public class UsuarioResumenService {

    private final UsuarioRepository usuarioRepository;
    private final InventarioUsuarioRepository inventarioRepository;

    public Map<Long, Usuario> usuarios(Collection<Long> ids) {
        Map<Long, Usuario> mapa = new HashMap<>();
        if (ids.isEmpty()) {
            return mapa;
        }
        usuarioRepository.findAllById(ids).forEach(u -> mapa.put(u.getId(), u));
        return mapa;
    }

    /** usuarioId -> (categoría -> imagen del artículo equipado). */
    public Map<Long, Map<String, String>> equipados(Collection<Long> ids) {
        Map<Long, Map<String, String>> mapa = new HashMap<>();
        if (ids.isEmpty()) {
            return mapa;
        }
        for (InventarioUsuario i : inventarioRepository.findEquipadosDe(ids)) {
            mapa.computeIfAbsent(i.getUsuarioId(), k -> new LinkedHashMap<>())
                    .put(i.getArticulo().getCategoria().name(), i.getArticulo().getImagen());
        }
        return mapa;
    }

    public static int nivel(Usuario u) {
        return ReglasGamificacion.nivelPara(u.getPuntos());
    }

    public static UsuarioMini mini(Usuario u, Map<Long, Map<String, String>> equipados) {
        return new UsuarioMini(u.getId(), u.getUsername(), nivel(u),
                equipados.getOrDefault(u.getId(), Map.of()));
    }
}
