package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.MetaCirculoDTO;
import com.medallo_map.wheretosmoke.dto.ReclamoMetaDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.CirculoConfianza;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.CirculoConfianzaRepository;
import com.medallo_map.wheretosmoke.repository.MiembroCirculoRepository;
import com.medallo_map.wheretosmoke.repository.ReclamoMetaCirculoRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.repository.VisitaSpotRepository;

import lombok.RequiredArgsConstructor;

/**
 * META SEMANAL COOPERATIVA DEL CÍRCULO.
 * Objetivo = max(10, 5 x miembros activos). Progreso = visitas a spots (visitas_spot, una por
 * miembro, spot y día) de los miembros activos entre el lunes y el domingo (America/Bogota).
 * Cuando se cumple, cada miembro activo reclama UNA vez por semana su cofre (40 monedas + 30 XP).
 * Idempotente: el INSERT IGNORE sobre reclamos_meta_circulo (único circulo+usuario+semana) es atómico.
 */
@Service
@RequiredArgsConstructor
public class CirculoMetaService {

    private final CirculoConfianzaRepository circuloRepository;
    private final MiembroCirculoRepository miembroRepository;
    private final VisitaSpotRepository visitaRepository;
    private final ReclamoMetaCirculoRepository reclamoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MonedasService monedasService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public MetaCirculoDTO obtener(Long circuloId, Long usuarioId) {
        exigirMiembroActivo(circuloId, usuarioId);
        LocalDate semana = ReglasGamificacion.periodoSemanal(clock);
        boolean yaReclamado = reclamoRepository.existsByCirculoIdAndUsuarioIdAndSemana(circuloId, usuarioId, semana);
        return calcular(circuloId, semana, yaReclamado);
    }

    @Transactional
    public ReclamoMetaDTO reclamar(Long circuloId, Long usuarioId) {
        exigirMiembroActivo(circuloId, usuarioId);
        LocalDate semana = ReglasGamificacion.periodoSemanal(clock);
        MetaCirculoDTO meta = calcular(circuloId, semana, false);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        int puntosAntes = usuario.getPuntos() == null ? 0 : usuario.getPuntos();

        if (!meta.isCompletada()) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "La meta semanal del círculo aún no está completa");
        }
        if (reclamoRepository.registrarSiNoExiste(circuloId, usuarioId, semana, LocalDateTime.now(clock)) == 0) {
            Integer saldo = usuarioRepository.obtenerMonedas(usuarioId);
            return ReclamoMetaDTO.builder().yaReclamado(true).saldoMonedas(saldo == null ? 0 : saldo)
                    .puntos(puntosAntes).nivel(ReglasGamificacion.nivelPara(puntosAntes)).build();
        }

        int saldo = monedasService.acreditar(usuarioId, ReglasGamificacion.META_CIRCULO_MONEDAS, "META_CIRCULO",
                circuloId + ":" + semana);
        usuarioRepository.sumarXp(usuarioId, ReglasGamificacion.META_CIRCULO_XP);
        int puntosDespues = puntosAntes + ReglasGamificacion.META_CIRCULO_XP;
        int nivelAntes = ReglasGamificacion.nivelPara(puntosAntes);
        int nivelDespues = ReglasGamificacion.nivelPara(puntosDespues);
        return ReclamoMetaDTO.builder().yaReclamado(false)
                .monedasGanadas(ReglasGamificacion.META_CIRCULO_MONEDAS).xpGanado(ReglasGamificacion.META_CIRCULO_XP)
                .saldoMonedas(saldo).puntos(puntosDespues).nivel(nivelDespues)
                .subioNivel(nivelDespues > nivelAntes).build();
    }

    private MetaCirculoDTO calcular(Long circuloId, LocalDate semana, boolean yaReclamado) {
        int miembros = Math.toIntExact(miembroRepository.contarMiembrosActivos(circuloId));
        int objetivo = ReglasGamificacion.objetivoMetaCirculo(miembros);
        int progreso = (int) visitaRepository.contarVisitasMiembros(circuloId, semana, semana.plusDays(6));
        boolean completada = progreso >= objetivo;
        return MetaCirculoDTO.builder()
                .progreso(progreso).objetivo(objetivo).completada(completada)
                .yaReclamado(yaReclamado).reclamosPendientes(completada && !yaReclamado)
                .miembros(miembros)
                .recompensaMonedas(ReglasGamificacion.META_CIRCULO_MONEDAS)
                .recompensaXp(ReglasGamificacion.META_CIRCULO_XP)
                .segundosRestantes(ReglasGamificacion.segundosHastaFinSemana(clock))
                .build();
    }

    private void exigirMiembroActivo(Long circuloId, Long usuarioId) {
        CirculoConfianza circulo = circuloRepository.findById(circuloId)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Círculo no encontrado"));
        if (!Boolean.TRUE.equals(circulo.getActivo())) {
            throw new NegocioException(HttpStatus.NOT_FOUND, "Círculo no encontrado");
        }
        boolean miembro = miembroRepository.findByCirculoIdAndUsuarioId(circuloId, usuarioId)
                .map(m -> Boolean.TRUE.equals(m.getActivo())).orElse(false);
        if (!miembro) {
            throw new NegocioException(HttpStatus.FORBIDDEN, "No eres miembro de este círculo");
        }
    }
}
