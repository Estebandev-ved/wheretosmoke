package com.medallo_map.wheretosmoke.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.FotoDTO;
import com.medallo_map.wheretosmoke.dto.ReaccionFotoDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.ReaccionFoto;
import com.medallo_map.wheretosmoke.repository.FotoRepository;
import com.medallo_map.wheretosmoke.repository.ReaccionFotoRepository;

import lombok.RequiredArgsConstructor;

/**
 * REACCIONES CON EMOJI A FOTOS (conviven con los likes, que no cambian).
 * Una reacción por usuario y foto: otro emoji la reemplaza, el mismo la quita.
 * Emojis permitidos: fuego, risa, sorpresa, corazón verde y hoja. En la BD se guarda un código.
 */
@Service
@RequiredArgsConstructor
public class ReaccionFotoService {

    /** emoji -> código guardado. Escapes unicode para no depender de la codificación del fuente. */
    public static final Map<String, String> EMOJIS = new LinkedHashMap<>();
    static {
        EMOJIS.put("🔥", "FUEGO"); // fuego
        EMOJIS.put("😂", "RISA"); // cara llorando de risa
        EMOJIS.put("😮", "SORPRESA"); // cara con boca abierta
        EMOJIS.put("💚", "CORAZON_VERDE"); // corazón verde
        EMOJIS.put("🌿", "HOJA"); // hierba
    }

    private final ReaccionFotoRepository reaccionRepository;
    private final FotoRepository fotoRepository;

    /** Normaliza (trim y sin selector de variación) y valida contra la lista fija. Devuelve el código. */
    public static String codigoDe(String emoji) {
        if (emoji == null) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "Falta el emoji");
        }
        String limpio = emoji.replace("️", "").trim();
        String codigo = EMOJIS.get(limpio);
        if (codigo == null) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "Emoji no permitido");
        }
        return codigo;
    }

    @Transactional
    public ReaccionFotoDTO reaccionar(Long fotoId, Long usuarioId, String emoji) {
        String codigo = codigoDe(emoji);
        if (!fotoRepository.existsById(fotoId)) {
            throw new NegocioException(HttpStatus.NOT_FOUND, "Foto no encontrada");
        }
        Optional<ReaccionFoto> existente = reaccionRepository.findByFotoIdAndUsuarioId(fotoId, usuarioId);
        if (existente.isPresent()) {
            ReaccionFoto r = existente.get();
            if (r.getCodigo().equals(codigo)) {
                reaccionRepository.delete(r); // repetir = quitar
            } else {
                r.setCodigo(codigo); // cambiar = reemplazar
                reaccionRepository.save(r);
            }
        } else {
            reaccionRepository.save(ReaccionFoto.builder().fotoId(fotoId).usuarioId(usuarioId).codigo(codigo).build());
        }
        List<FotoDTO> unica = List.of(FotoDTO.builder().id(fotoId).build());
        anexar(unica, usuarioId);
        return ReaccionFotoDTO.builder().fotoId(fotoId).miReaccion(unica.get(0).getMiReaccion())
                .reacciones(unica.get(0).getReacciones()).build();
    }

    /** Rellena reacciones y miReaccion de varias fotos con 2 consultas. usuarioId puede ser null. */
    @Transactional(readOnly = true)
    public void anexar(List<FotoDTO> fotos, Long usuarioId) {
        if (fotos == null || fotos.isEmpty()) {
            return;
        }
        List<Long> ids = fotos.stream().map(FotoDTO::getId).toList();
        Map<Long, Map<String, Integer>> conteos = new HashMap<>();
        for (Object[] f : reaccionRepository.contarPorFoto(ids)) {
            conteos.computeIfAbsent(((Number) f[0]).longValue(), k -> new HashMap<>())
                    .put((String) f[1], ((Number) f[2]).intValue());
        }
        Map<Long, String> propias = usuarioId == null ? Map.of() : mias(usuarioId, ids);
        Map<String, String> emojiPorCodigo = EMOJIS.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getValue, Map.Entry::getKey));
        for (FotoDTO foto : fotos) {
            Map<String, Integer> porCodigo = conteos.getOrDefault(foto.getId(), Map.of());
            Map<String, Integer> reacciones = new LinkedHashMap<>();
            EMOJIS.forEach((emoji, codigo) -> reacciones.put(emoji, porCodigo.getOrDefault(codigo, 0)));
            foto.setReacciones(reacciones);
            String propia = propias.get(foto.getId());
            foto.setMiReaccion(propia == null ? null : emojiPorCodigo.get(propia));
        }
    }

    private Map<Long, String> mias(Long usuarioId, Collection<Long> ids) {
        return reaccionRepository.findByUsuarioIdAndFotoIdIn(usuarioId, ids).stream()
                .collect(Collectors.toMap(ReaccionFoto::getFotoId, ReaccionFoto::getCodigo, (a, b) -> a));
    }
}
