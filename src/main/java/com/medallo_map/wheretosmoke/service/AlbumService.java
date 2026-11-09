package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.AlbumComunaDTO;
import com.medallo_map.wheretosmoke.repository.SelloComunaRepository;
import com.medallo_map.wheretosmoke.repository.SpotRepository;
import com.medallo_map.wheretosmoke.repository.VisitaSpotRepository;

import lombok.RequiredArgsConstructor;

/**
 * ÁLBUM POR COMUNA: visitar (crear, votar, calificar, comentar, subir foto) todos los spots de una
 * comuna la completa (mínimo 3 spots en la comuna). Al completarla por primera vez se otorga un sello
 * y un bono de 50 monedas, una sola vez: el INSERT IGNORE sobre sellos_comuna (único usuario+comuna)
 * es atómico, y el bono se paga en la misma transacción.
 */
@Service
@RequiredArgsConstructor
public class AlbumService {

    private final SpotRepository spotRepository;
    private final VisitaSpotRepository visitaRepository;
    private final SelloComunaRepository selloRepository;
    private final MonedasService monedasService;
    private final Clock clock;

    /** Álbum completo (todas las comunas del catálogo). Otorga los sellos pendientes que ya correspondan. */
    @Transactional
    public List<AlbumComunaDTO> obtenerAlbum(Long usuarioId) {
        Map<String, Integer> totales = aMapa(spotRepository.contarPorComuna());
        Map<String, Integer> visitados = aMapa(visitaRepository.visitadosPorComuna(usuarioId));
        Set<String> conSello = new HashSet<>();
        selloRepository.findByUsuarioId(usuarioId).forEach(s -> conSello.add(s.getComuna()));

        List<AlbumComunaDTO> album = new ArrayList<>();
        for (ComunasMedellin.Comuna c : ComunasMedellin.TODAS) {
            int total = totales.getOrDefault(c.nombre(), 0);
            int vis = Math.min(visitados.getOrDefault(c.nombre(), 0), total);
            boolean completaAhora = ReglasGamificacion.albumCompleto(total, vis);
            boolean tieneSello = conSello.contains(c.nombre());
            if (completaAhora && !tieneSello) {
                otorgarSello(usuarioId, c.nombre());
            }
            album.add(AlbumComunaDTO.builder().comuna(c.nombre()).totalSpots(total).visitados(vis)
                    .completa(completaAhora || tieneSello).sello(ComunasMedellin.sello(c.nombre())).build());
        }
        return album;
    }

    /** Revisa una comuna tras una visita nueva y otorga el sello si ya la completó. */
    @Transactional
    public boolean verificarComuna(Long usuarioId, String comuna) {
        long total = spotRepository.countByComuna(comuna);
        long vis = visitaRepository.contarVisitadosEnComuna(usuarioId, comuna);
        if (!ReglasGamificacion.albumCompleto(total, vis)) {
            return false;
        }
        return otorgarSello(usuarioId, comuna);
    }

    /** true si el sello se otorgó ahora; false si ya lo tenía. Paga el bono solo la primera vez. */
    private boolean otorgarSello(Long usuarioId, String comuna) {
        if (selloRepository.otorgarSiNoExiste(usuarioId, comuna, LocalDateTime.now(clock)) == 0) {
            return false;
        }
        monedasService.acreditar(usuarioId, ReglasGamificacion.BONO_ALBUM_MONEDAS, "ALBUM_COMUNA", comuna);
        return true;
    }

    private static Map<String, Integer> aMapa(List<Object[]> filas) {
        Map<String, Integer> mapa = new HashMap<>();
        for (Object[] f : filas) {
            mapa.put((String) f[0], ((Number) f[1]).intValue());
        }
        return mapa;
    }
}
