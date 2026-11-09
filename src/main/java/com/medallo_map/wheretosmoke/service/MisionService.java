package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.MisionDTO;
import com.medallo_map.wheretosmoke.dto.MisionesResponseDTO;
import com.medallo_map.wheretosmoke.dto.ReclamoMisionDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.AccionMision;
import com.medallo_map.wheretosmoke.model.Mision;
import com.medallo_map.wheretosmoke.model.MisionUsuario;
import com.medallo_map.wheretosmoke.model.TipoMision;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.MisionRepository;
import com.medallo_map.wheretosmoke.repository.MisionUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * MISIONES DIARIAS Y SEMANALES (servidor autoritativo).
 *
 * - El progreso solo sube desde eventos reales del servidor (registrarAccion).
 * - El progreso se detiene en la meta: ese es el tope anti-farmeo por día/semana
 *   (p. ej. solo cuentan los primeros N votos del día para la misión de votar).
 * - La recompensa solo se paga al reclamar, una vez por misión y periodo.
 * - Periodo: fecha del día (DIARIA) o lunes de la semana (SEMANAL), America/Bogota.
 */
@Service
@RequiredArgsConstructor
public class MisionService {

    private static final Logger log = LoggerFactory.getLogger(MisionService.class);

    private final MisionRepository misionRepository;
    private final MisionUsuarioRepository misionUsuarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final MonedasService monedasService;
    private final Clock clock;

    /**
     * Suma 1 al progreso de las misiones activas con esa acción.
     * Nunca lanza excepción: un fallo de misiones no debe romper votar/comentar/subir foto.
     * Sin usuario (votos anónimos por fingerprint) no hace nada.
     * No es transaccional a propósito: cada guardado es independiente.
     */
    public void registrarAccion(Long usuarioId, AccionMision accion) {
        if (usuarioId == null || accion == null) {
            return;
        }
        try {
            for (Mision mision : misionRepository.findByAccionAndActivaTrue(accion)) {
                LocalDate periodo = periodoDe(mision.getTipo());
                MisionUsuario mu = misionUsuarioRepository
                        .findByUsuarioIdAndMisionIdAndPeriodo(usuarioId, mision.getId(), periodo)
                        .orElseGet(() -> MisionUsuario.builder()
                                .usuarioId(usuarioId).mision(mision).periodo(periodo).build());
                if (mu.isCompletada()) {
                    continue; // tope alcanzado: no se sigue contando
                }
                mu.setProgreso(Math.min(mu.getProgreso() + 1, mision.getMeta()));
                mu.setCompletada(mu.getProgreso() >= mision.getMeta());
                misionUsuarioRepository.save(mu);
            }
        } catch (RuntimeException e) {
            log.warn("No se pudo registrar la acción {} del usuario {}: {}", accion, usuarioId, e.getMessage());
        }
    }

    /** Misiones vigentes con el progreso del usuario. */
    @Transactional(readOnly = true)
    public MisionesResponseDTO obtenerMisiones(Long usuarioId) {
        LocalDate dia = ReglasGamificacion.periodoDiario(clock);
        LocalDate semana = ReglasGamificacion.periodoSemanal(clock);
        // List (no Set.of): en lunes dia == semana y Set.of lanzaría IllegalArgumentException por duplicado.
        List<MisionUsuario> progresos = misionUsuarioRepository.findByUsuarioIdAndPeriodoIn(usuarioId,
                List.of(dia, semana));

        List<MisionDTO> diarias = new ArrayList<>();
        List<MisionDTO> semanales = new ArrayList<>();
        for (Mision m : misionRepository.findByActivaTrueOrderByTipoAscIdAsc()) {
            LocalDate periodo = m.getTipo() == TipoMision.DIARIA ? dia : semana;
            MisionUsuario mu = progresos.stream()
                    .filter(p -> p.getMision().getId().equals(m.getId()) && p.getPeriodo().equals(periodo))
                    .findFirst().orElse(null);
            MisionDTO dto = MisionDTO.builder()
                    .id(m.getId()).codigo(m.getCodigo()).titulo(m.getTitulo()).descripcion(m.getDescripcion())
                    .tipo(m.getTipo()).accion(m.getAccion()).meta(m.getMeta())
                    .progreso(mu == null ? 0 : mu.getProgreso())
                    .completada(mu != null && mu.isCompletada())
                    .reclamada(mu != null && mu.isReclamada())
                    .recompensaXp(m.getRecompensaXp()).recompensaMonedas(m.getRecompensaMonedas())
                    .build();
            (m.getTipo() == TipoMision.DIARIA ? diarias : semanales).add(dto);
        }
        return MisionesResponseDTO.builder()
                .diarias(diarias).semanales(semanales)
                .segundosReinicioDiario(ReglasGamificacion.segundosHastaFinDia(clock))
                .segundosReinicioSemanal(ReglasGamificacion.segundosHastaFinSemana(clock))
                .build();
    }

    /**
     * Reclama la recompensa de una misión completada del periodo vigente.
     * Idempotente: el UPDATE condicional (reclamada=false) solo tiene éxito una vez,
     * así que un doble clic o dos peticiones paralelas no pagan dos veces (la segunda recibe 409).
     */
    @Transactional
    public ReclamoMisionDTO reclamar(Long usuarioId, Long misionId) {
        Mision mision = misionRepository.findById(misionId)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Misión no encontrada"));
        LocalDate periodo = periodoDe(mision.getTipo());

        MisionUsuario mu = misionUsuarioRepository
                .findByUsuarioIdAndMisionIdAndPeriodo(usuarioId, misionId, periodo)
                .orElseThrow(() -> new NegocioException(HttpStatus.BAD_REQUEST, "Aún no completas esta misión"));
        if (!mu.isCompletada()) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "Aún no completas esta misión");
        }
        if (misionUsuarioRepository.marcarReclamada(mu.getId()) == 0) {
            throw new NegocioException(HttpStatus.CONFLICT, "Ya reclamaste la recompensa de esta misión");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        int puntosAntes = usuario.getPuntos() == null ? 0 : usuario.getPuntos();

        int mult = ReglasGamificacion.multiplicadorEvento(clock); // hora feliz 4:20 = x2
        int monedasPremio = mision.getRecompensaMonedas() * mult;
        int xpPremio = mision.getRecompensaXp() * mult;

        int saldo;
        if (monedasPremio > 0) {
            saldo = monedasService.acreditar(usuarioId, monedasPremio, "MISION", mision.getCodigo());
        } else {
            Integer m = usuarioRepository.obtenerMonedas(usuarioId);
            saldo = m == null ? 0 : m;
        }
        if (xpPremio > 0) {
            usuarioRepository.sumarXp(usuarioId, xpPremio);
        }
        int puntosDespues = puntosAntes + Math.max(0, xpPremio);
        int nivelAntes = ReglasGamificacion.nivelPara(puntosAntes);
        int nivelDespues = ReglasGamificacion.nivelPara(puntosDespues);

        return ReclamoMisionDTO.builder()
                .misionId(misionId).codigo(mision.getCodigo())
                .xpGanado(xpPremio).monedasGanadas(monedasPremio)
                .monedas(saldo).puntos(puntosDespues).nivel(nivelDespues)
                .subioNivel(nivelDespues > nivelAntes)
                .multiplicador(mult)
                .build();
    }

    private LocalDate periodoDe(TipoMision tipo) {
        return tipo == TipoMision.SEMANAL
                ? ReglasGamificacion.periodoSemanal(clock)
                : ReglasGamificacion.periodoDiario(clock);
    }
}
