package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDate;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.CheckinDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * CHECK-IN DIARIO Y RACHA.
 * Idempotente por día (America/Bogota): el UPDATE condicional sobre ultima_actividad
 * garantiza que solo una petición del día cobra el bono, aunque lleguen en paralelo.
 */
@Service
@RequiredArgsConstructor
public class CheckinService {

    private final UsuarioRepository usuarioRepository;
    private final MonedasService monedasService;
    private final Clock clock;

    @Transactional
    public CheckinDTO checkin(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        LocalDate hoy = LocalDate.now(clock);
        int rachaActual = usuario.getRachaDias() == null ? 0 : usuario.getRachaDias();
        int puntos = usuario.getPuntos() == null ? 0 : usuario.getPuntos();
        Integer monedas = usuarioRepository.obtenerMonedas(usuarioId);
        int saldo = monedas == null ? 0 : monedas;

        // Ya hizo check-in hoy: respuesta idempotente, sin pagar
        if (hoy.equals(usuario.getUltimaActividad())) {
            return respuesta(true, rachaActual, 0, 0, saldo, puntos);
        }

        int nuevaRacha = ReglasGamificacion.nuevaRacha(usuario.getUltimaActividad(), hoy, rachaActual);
        if (usuarioRepository.registrarCheckin(usuarioId, nuevaRacha, hoy) == 0) {
            // Otra petición paralela ganó la carrera
            return respuesta(true, nuevaRacha, 0, 0, saldo, puntos);
        }

        int bono = ReglasGamificacion.bonoMonedasRacha(nuevaRacha);
        int xp = ReglasGamificacion.XP_CHECKIN;
        int saldoFinal = monedasService.acreditar(usuarioId, bono, "CHECKIN", hoy.toString());
        usuarioRepository.sumarXp(usuarioId, xp);

        return respuesta(false, nuevaRacha, bono, xp, saldoFinal, puntos + xp);
    }

    private CheckinDTO respuesta(boolean yaHecho, int racha, int monedasGanadas, int xp, int saldo, int puntos) {
        return CheckinDTO.builder()
                .yaHecho(yaHecho)
                .rachaDias(racha)
                .monedasGanadas(monedasGanadas)
                .xpGanado(xp)
                .monedas(saldo)
                .puntos(puntos)
                .nivel(ReglasGamificacion.nivelPara(puntos))
                .bonoManana(ReglasGamificacion.bonoMonedasRacha(racha + 1))
                .build();
    }
}
