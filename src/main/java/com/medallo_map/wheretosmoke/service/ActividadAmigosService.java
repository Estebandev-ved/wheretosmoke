package com.medallo_map.wheretosmoke.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.SocialDTO.ActividadAmigo;
import com.medallo_map.wheretosmoke.model.Amistad;
import com.medallo_map.wheretosmoke.model.EstadoAmistad;
import com.medallo_map.wheretosmoke.model.SelloComuna;
import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.AmistadRepository;
import com.medallo_map.wheretosmoke.repository.PersonasRepository;
import com.medallo_map.wheretosmoke.repository.SpotRepository;

import lombok.RequiredArgsConstructor;

/**
 * Actividad reciente de mis amigos derivada de tablas existentes: spots que crearon, sellos de comuna y fotos.
 * Nunca incluye ubicación exacta, monedas ni datos de cuenta. Solo amigos aceptados (bloquear rompe la amistad).
 */
@Service
@RequiredArgsConstructor
public class ActividadAmigosService {

    public static final int LIMITE_DEFECTO = 20;
    public static final int LIMITE_MAX = 50;

    private final AmistadRepository amistadRepository;
    private final PersonasRepository personasRepository;
    private final SpotRepository spotRepository;
    private final UsuarioResumenService resumen;

    @Transactional(readOnly = true)
    public List<ActividadAmigo> actividad(Long yo, Integer limite) {
        int lim = limite == null ? LIMITE_DEFECTO : Math.max(1, Math.min(limite, LIMITE_MAX));
        List<Long> amigos = new ArrayList<>();
        for (Amistad a : amistadRepository.findAmigos(yo, EstadoAmistad.ACEPTADA)) {
            if (a.getEstado() == EstadoAmistad.ACEPTADA) {
                amigos.add(a.otroDe(yo));
            }
        }
        if (amigos.isEmpty()) {
            return List.of();
        }

        List<Object[]> spotsCreados = personasRepository.spotsCreados(amigos, lim);
        List<SelloComuna> sellos = personasRepository.sellosRecientes(amigos, PageRequest.of(0, lim));
        List<Object[]> fotos = personasRepository.fotosRecientes(amigos, PageRequest.of(0, lim));

        Set<Long> idsSpotsFoto = new HashSet<>();
        for (Object[] f : fotos) {
            idsSpotsFoto.add(((Number) f[2]).longValue());
        }
        Map<Long, String> nombresSpot = new java.util.HashMap<>();
        if (!idsSpotsFoto.isEmpty()) {
            for (Spot s : spotRepository.findAllById(idsSpotsFoto)) {
                nombresSpot.put(s.getId(), s.getNombre());
            }
        }

        Map<Long, Usuario> usuarios = resumen.usuarios(amigos);
        Map<Long, Map<String, String>> equipados = resumen.equipados(amigos);

        List<ActividadAmigo> out = new ArrayList<>();
        for (Object[] f : spotsCreados) {
            Usuario u = usuarios.get(((Number) f[2]).longValue());
            LocalDateTime fecha = fecha(f[3]);
            if (u != null && fecha != null) {
                out.add(new ActividadAmigo(UsuarioResumenService.mini(u, equipados), "SPOT_DESCUBIERTO",
                        "descubrió " + f[1], fecha, ((Number) f[0]).longValue()));
            }
        }
        for (SelloComuna s : sellos) {
            Usuario u = usuarios.get(s.getUsuarioId());
            if (u != null) {
                out.add(new ActividadAmigo(UsuarioResumenService.mini(u, equipados), "SELLO_COMUNA",
                        "completó la comuna " + s.getComuna(), s.getFecha(), null));
            }
        }
        for (Object[] f : fotos) {
            Usuario u = usuarios.get(((Number) f[1]).longValue());
            Long spotId = ((Number) f[2]).longValue();
            if (u != null) {
                String nombre = nombresSpot.get(spotId);
                out.add(new ActividadAmigo(UsuarioResumenService.mini(u, equipados), "FOTO",
                        nombre == null ? "subió una foto" : "subió una foto en " + nombre, (LocalDateTime) f[3],
                        spotId));
            }
        }
        out.sort(Comparator.comparing(ActividadAmigo::fecha).reversed());
        return out.size() > lim ? new ArrayList<>(out.subList(0, lim)) : out;
    }

    /** Las consultas nativas pueden devolver Timestamp; las JPQL, LocalDateTime. */
    private static LocalDateTime fecha(Object o) {
        if (o instanceof LocalDateTime l) {
            return l;
        }
        if (o instanceof java.sql.Timestamp t) {
            return t.toLocalDateTime();
        }
        return null;
    }
}
