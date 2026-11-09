package com.medallo_map.wheretosmoke.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.repository.TransaccionMonedasRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * BONO DE DESCUBRIDOR: quien crea un spot gana monedas y XP, una sola vez por spot.
 * La guardia de idempotencia es la transacción de monedas (motivo DESCUBRIDOR, referencia spot:ID).
 */
@Service
@RequiredArgsConstructor
public class DescubridorService {

    public static final String MOTIVO = "DESCUBRIDOR";

    private final MonedasService monedasService;
    private final UsuarioRepository usuarioRepository;
    private final TransaccionMonedasRepository transaccionRepository;

    /** Devuelve true si se pagó ahora, false si el bono de ese spot ya estaba pagado. */
    @Transactional
    public boolean premiar(Long usuarioId, Long spotId) {
        String referencia = "spot:" + spotId;
        if (transaccionRepository.existsByUsuarioIdAndMotivoAndReferencia(usuarioId, MOTIVO, referencia)) {
            return false;
        }
        monedasService.acreditar(usuarioId, ReglasGamificacion.BONO_DESCUBRIDOR_MONEDAS, MOTIVO, referencia);
        usuarioRepository.sumarXp(usuarioId, ReglasGamificacion.BONO_DESCUBRIDOR_XP);
        return true;
    }
}
