package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.repository.VisitaSpotRepository;

import lombok.RequiredArgsConstructor;

/**
 * REGISTRO DE VISITAS (una por usuario, spot y día Bogotá).
 * Nunca lanza excepción: un fallo aquí no debe romper crear/votar/comentar/calificar/subir foto.
 * No es transaccional a propósito: cada escritura es atómica por sí sola (INSERT IGNORE).
 * Al registrar una visita nueva se revisa si completó el álbum de la comuna del spot.
 */
@Service
@RequiredArgsConstructor
public class VisitaService {

    private static final Logger log = LoggerFactory.getLogger(VisitaService.class);

    private final VisitaSpotRepository visitaRepository;
    private final AlbumService albumService;
    private final Clock clock;

    public void registrar(Long usuarioId, Spot spot) {
        if (usuarioId == null || spot == null || spot.getId() == null) {
            return;
        }
        try {
            int nuevas = visitaRepository.registrarSiNoExiste(usuarioId, spot.getId(),
                    LocalDate.now(clock), LocalDateTime.now(clock));
            if (nuevas > 0 && spot.getComuna() != null) {
                albumService.verificarComuna(usuarioId, spot.getComuna());
            }
        } catch (RuntimeException e) {
            log.warn("No se pudo registrar la visita del usuario {} al spot {}: {}", usuarioId, spot.getId(),
                    e.getMessage());
        }
    }
}
