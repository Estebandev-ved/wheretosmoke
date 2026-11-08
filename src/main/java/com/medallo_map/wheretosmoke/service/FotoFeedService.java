package com.medallo_map.wheretosmoke.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.medallo_map.wheretosmoke.dto.ComentarioFotoDTO;
import com.medallo_map.wheretosmoke.dto.FotoDTO;
import com.medallo_map.wheretosmoke.model.ComentarioFoto;
import com.medallo_map.wheretosmoke.model.Foto;
import com.medallo_map.wheretosmoke.model.LikeFoto;
import com.medallo_map.wheretosmoke.repository.ComentarioFotoRepository;
import com.medallo_map.wheretosmoke.repository.FotoRepository;
import com.medallo_map.wheretosmoke.repository.LikeFotoRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * 📸 SERVICIO DEL FEED DE FOTOS
 * 
 * Maneja likes (toggle) y comentarios en fotos.
 */
@Service
@RequiredArgsConstructor
public class FotoFeedService {

    private final FotoRepository fotoRepository;
    private final ComentarioFotoRepository comentarioFotoRepository;
    private final LikeFotoRepository likeFotoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MisionService misionService;

    // ═══════════════════════════════════════════════════════════════
    // ❤️ LIKES - Toggle (like/unlike)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Toggle like: si ya dio like lo quita, si no lo agrega.
     * Retorna un Map con { likes: N, liked: boolean }
     */
    public Map<String, Object> toggleLike(Long fotoId, Long usuarioId) {
        Foto foto = fotoRepository.findById(fotoId)
                .orElseThrow(() -> new RuntimeException("Foto no encontrada"));

        boolean yaLeDioLike = likeFotoRepository.existsByFotoIdAndUsuarioId(fotoId, usuarioId);
        boolean liked;

        if (yaLeDioLike) {
            // Quitar like
            likeFotoRepository.findByFotoIdAndUsuarioId(fotoId, usuarioId)
                    .ifPresent(likeFotoRepository::delete);
            liked = false;
        } else {
            // Dar like
            LikeFoto nuevoLike = LikeFoto.builder()
                    .fotoId(fotoId)
                    .usuarioId(usuarioId)
                    .fecha(LocalDateTime.now())
                    .build();
            likeFotoRepository.save(nuevoLike);
            liked = true;
        }

        // Actualizar contador en la foto
        int totalLikes = likeFotoRepository.countByFotoId(fotoId);
        foto.setLikes(totalLikes);
        fotoRepository.save(foto);

        Map<String, Object> result = new HashMap<>();
        result.put("likes", totalLikes);
        result.put("liked", liked);
        return result;
    }

    /**
     * Verifica si un usuario ya dio like a una foto.
     */
    public boolean hasLiked(Long fotoId, Long usuarioId) {
        if (usuarioId == null)
            return false;
        return likeFotoRepository.existsByFotoIdAndUsuarioId(fotoId, usuarioId);
    }

    // ═══════════════════════════════════════════════════════════════
    // 💬 COMENTARIOS EN FOTOS
    // ═══════════════════════════════════════════════════════════════

    public List<ComentarioFotoDTO> obtenerComentarios(Long fotoId) {
        return comentarioFotoRepository.findByFotoIdOrderByFechaDesc(fotoId)
                .stream()
                .map(ComentarioFotoDTO::fromComentarioFoto)
                .collect(Collectors.toList());
    }

    public ComentarioFotoDTO agregarComentario(Long fotoId, Long usuarioId, String texto) {
        fotoRepository.findById(fotoId)
                .orElseThrow(() -> new RuntimeException("Foto no encontrada"));

        String nombreUsuario = "Anónimo";
        if (usuarioId != null) {
            nombreUsuario = usuarioRepository.findById(usuarioId)
                    .map(u -> u.getUsername())
                    .orElse("Anónimo");
        }

        ComentarioFoto comentario = ComentarioFoto.builder()
                .fotoId(fotoId)
                .usuarioId(usuarioId)
                .usuarioNombre(nombreUsuario)
                .texto(texto)
                .fecha(LocalDateTime.now())
                .build();

        comentario = comentarioFotoRepository.save(comentario);
        if (usuarioId != null) {
            misionService.registrarAccion(usuarioId, com.medallo_map.wheretosmoke.model.AccionMision.COMENTAR);
        }
        return ComentarioFotoDTO.fromComentarioFoto(comentario);
    }
}
