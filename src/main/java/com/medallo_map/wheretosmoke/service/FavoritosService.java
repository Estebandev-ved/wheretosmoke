package com.medallo_map.wheretosmoke.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.model.Favorito;
import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.repository.FavoritoRepository;
import com.medallo_map.wheretosmoke.repository.SpotRepository;

import lombok.RequiredArgsConstructor;

/**
 * ❤️ SERVICIO DE FAVORITOS
 */
@Service
@RequiredArgsConstructor
public class FavoritosService {

    private final FavoritoRepository favoritoRepository;
    private final SpotRepository spotRepository;

    /**
     * 📋 Obtener mis favoritos
     */
    public List<Spot> obtenerMisFavoritos(Long usuarioId) {
        List<Favorito> favoritos = favoritoRepository.findByUsuarioIdOrderByFechaAgregadoDesc(usuarioId);

        return favoritos.stream()
                .map(fav -> spotRepository.findById(fav.getSpotId()).orElse(null))
                .filter(spot -> spot != null)
                .collect(Collectors.toList());
    }

    /**
     * ❤️ Agregar favorito
     */
    public boolean agregarFavorito(Long usuarioId, Long spotId) {
        if (favoritoRepository.existsByUsuarioIdAndSpotId(usuarioId, spotId)) {
            return false; // Ya es favorito
        }

        Favorito favorito = Favorito.builder()
                .usuarioId(usuarioId)
                .spotId(spotId)
                .fechaAgregado(LocalDateTime.now())
                .notificacionesActivas(true)
                .build();

        favoritoRepository.save(favorito);
        return true;
    }

    /**
     * 💔 Quitar favorito
     */
    @Transactional
    public boolean quitarFavorito(Long usuarioId, Long spotId) {
        if (!favoritoRepository.existsByUsuarioIdAndSpotId(usuarioId, spotId)) {
            return false; // No era favorito
        }

        favoritoRepository.deleteByUsuarioIdAndSpotId(usuarioId, spotId);
        return true;
    }

    /**
     * ❓ Verificar si es favorito
     */
    public boolean esFavorito(Long usuarioId, Long spotId) {
        return favoritoRepository.existsByUsuarioIdAndSpotId(usuarioId, spotId);
    }

    /**
     * 🔔 Toggle notificaciones
     */
    public boolean toggleNotificaciones(Long usuarioId, Long spotId) {
        return favoritoRepository.findByUsuarioIdAndSpotId(usuarioId, spotId)
                .map(fav -> {
                    fav.setNotificacionesActivas(!fav.getNotificacionesActivas());
                    favoritoRepository.save(fav);
                    return fav.getNotificacionesActivas();
                })
                .orElse(false);
    }

    /**
     * 📣 Obtener usuarios a notificar para un spot
     */
    public List<Long> obtenerUsuariosANotificar(Long spotId) {
        return favoritoRepository.findUsuariosConNotificaciones(spotId);
    }
}
