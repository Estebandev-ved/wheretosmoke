package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.SocialDTO.Amigo;
import com.medallo_map.wheretosmoke.dto.SocialDTO.SolicitudItem;
import com.medallo_map.wheretosmoke.dto.SocialDTO.SolicitudResultado;
import com.medallo_map.wheretosmoke.dto.SocialDTO.Solicitudes;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Amistad;
import com.medallo_map.wheretosmoke.model.EstadoAmistad;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.AmistadRepository;
import com.medallo_map.wheretosmoke.repository.BloqueoRepository;
import com.medallo_map.wheretosmoke.repository.MensajePrivadoRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * AMISTADES: solicitudes, aceptar/rechazar/cancelar, lista de amigos y eliminar amistad.
 * Una sola fila por par (ver Amistad): el índice único evita duplicados y solicitudes cruzadas simultáneas.
 */
@Service
@RequiredArgsConstructor
public class AmistadService {

    public static final int MAX_AMIGOS = 100;
    public static final int MAX_SOLICITUDES_ENVIADAS = 20;

    private final AmistadRepository amistadRepository;
    private final BloqueoRepository bloqueoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MensajePrivadoRepository mensajeRepository;
    private final UsuarioResumenService resumen;
    private final Clock clock;

    public static Long menor(Long a, Long b) {
        return a <= b ? a : b;
    }

    public static Long mayor(Long a, Long b) {
        return a <= b ? b : a;
    }

    /** true si hay una amistad ACEPTADA entre los dos. */
    public boolean sonAmigos(Long a, Long b) {
        return amistadRepository.findByUsuarioMenorAndUsuarioMayor(menor(a, b), mayor(a, b))
                .map(x -> x.getEstado() == EstadoAmistad.ACEPTADA).orElse(false);
    }

    /** Ids de las personas con las que el usuario tiene una amistad aceptada. */
    public Set<Long> idsAmigos(Long usuarioId) {
        return amistadRepository.findAmigos(usuarioId, EstadoAmistad.ACEPTADA).stream()
                .map(a -> a.otroDe(usuarioId)).collect(Collectors.toSet());
    }

    /** Estado de amistad visto por {@code yo}: NINGUNA, ENVIADA, RECIBIDA o AMIGOS. */
    public static String estadoDe(Amistad a, Long yo) {
        if (a == null) {
            return "NINGUNA";
        }
        if (a.getEstado() == EstadoAmistad.ACEPTADA) {
            return "AMIGOS";
        }
        return a.getSolicitanteId().equals(yo) ? "ENVIADA" : "RECIBIDA";
    }

    // ── Solicitudes ──────────────────────────────────────────────────────────

    @Transactional
    public SolicitudResultado enviarSolicitud(Long yo, Long destinoId) {
        if (destinoId == null) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "Falta el usuario destino");
        }
        if (yo.equals(destinoId)) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "No puedes enviarte una solicitud a ti mismo");
        }
        Usuario destino = usuarioRepository.findById(destinoId).orElse(null);
        if (destino == null || !destino.isActivo()
                || bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(destinoId, yo)) {
            throw new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        if (bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(yo, destinoId)) {
            throw new NegocioException(HttpStatus.FORBIDDEN, "Desbloquea a este usuario para enviarle una solicitud");
        }

        Long menor = menor(yo, destinoId);
        Long mayor = mayor(yo, destinoId);
        Amistad existente = amistadRepository.findByUsuarioMenorAndUsuarioMayor(menor, mayor).orElse(null);
        if (existente != null) {
            if (existente.getEstado() == EstadoAmistad.ACEPTADA) {
                throw new NegocioException(HttpStatus.CONFLICT, "Ya son amigos");
            }
            if (existente.getSolicitanteId().equals(yo)) {
                throw new NegocioException(HttpStatus.CONFLICT, "Ya enviaste una solicitud a esta persona");
            }
            // La otra persona ya me había enviado una: se acepta automáticamente.
            return new SolicitudResultado(confirmar(existente, yo).getId(), "AMIGOS");
        }

        verificarPrivacidad(yo, destino);
        if (amistadRepository.contarAmigos(yo, EstadoAmistad.ACEPTADA) >= MAX_AMIGOS) {
            throw new NegocioException(HttpStatus.CONFLICT, "Alcanzaste el límite de " + MAX_AMIGOS + " amigos");
        }
        if (amistadRepository.countBySolicitanteIdAndEstado(yo, EstadoAmistad.PENDIENTE) >= MAX_SOLICITUDES_ENVIADAS) {
            throw new NegocioException(HttpStatus.CONFLICT,
                    "Tienes demasiadas solicitudes pendientes (máximo " + MAX_SOLICITUDES_ENVIADAS + ")");
        }
        Amistad nueva = amistadRepository.saveAndFlush(Amistad.builder()
                .usuarioMenor(menor).usuarioMayor(mayor).solicitanteId(yo)
                .estado(EstadoAmistad.PENDIENTE).fechaSolicitud(LocalDateTime.now(clock)).build());
        return new SolicitudResultado(nueva.getId(), "ENVIADA");
    }

    /** Respeta "quién puede enviarme solicitudes" del destinatario (TODOS | AMIGOS_DE_AMIGOS | NADIE). */
    private void verificarPrivacidad(Long yo, Usuario destino) {
        String modo = destino.modoSolicitudes();
        if ("NADIE".equals(modo)) {
            throw new NegocioException(HttpStatus.FORBIDDEN, "Esta persona no acepta solicitudes de amistad");
        }
        if ("AMIGOS_DE_AMIGOS".equals(modo)) {
            Set<Long> mios = idsAmigos(yo);
            boolean enComun = !mios.isEmpty() && amistadRepository.findRelacionesCon(destino.getId(), mios).stream()
                    .anyMatch(a -> a.getEstado() == EstadoAmistad.ACEPTADA);
            if (!enComun) {
                throw new NegocioException(HttpStatus.FORBIDDEN,
                        "Esta persona solo acepta solicitudes de amigos de sus amigos");
            }
        }
    }

    @Transactional
    public SolicitudResultado aceptar(Long yo, Long solicitudId) {
        Amistad a = solicitudDe(yo, solicitudId);
        if (a.getSolicitanteId().equals(yo)) {
            throw new NegocioException(HttpStatus.FORBIDDEN, "Solo quien recibe la solicitud puede aceptarla");
        }
        return new SolicitudResultado(confirmar(a, yo).getId(), "AMIGOS");
    }

    @Transactional
    public SolicitudResultado rechazar(Long yo, Long solicitudId) {
        Amistad a = solicitudDe(yo, solicitudId);
        if (a.getSolicitanteId().equals(yo)) {
            throw new NegocioException(HttpStatus.FORBIDDEN, "Solo quien recibe la solicitud puede rechazarla");
        }
        amistadRepository.borrarPar(a.getUsuarioMenor(), a.getUsuarioMayor());
        return new SolicitudResultado(a.getId(), "RECHAZADA");
    }

    @Transactional
    public SolicitudResultado cancelar(Long yo, Long solicitudId) {
        Amistad a = solicitudDe(yo, solicitudId);
        if (!a.getSolicitanteId().equals(yo)) {
            throw new NegocioException(HttpStatus.FORBIDDEN, "Solo quien envió la solicitud puede cancelarla");
        }
        amistadRepository.borrarPar(a.getUsuarioMenor(), a.getUsuarioMayor());
        return new SolicitudResultado(a.getId(), "CANCELADA");
    }

    /** Solicitud PENDIENTE en la que participa {@code yo}; si no existe o no participa: 404 (sin filtrar datos). */
    private Amistad solicitudDe(Long yo, Long solicitudId) {
        Amistad a = amistadRepository.findById(solicitudId).orElse(null);
        if (a == null || a.getEstado() != EstadoAmistad.PENDIENTE
                || !(yo.equals(a.getUsuarioMenor()) || yo.equals(a.getUsuarioMayor()))) {
            throw new NegocioException(HttpStatus.NOT_FOUND, "Solicitud no encontrada");
        }
        return a;
    }

    /** Pasa la solicitud a amistad verificando el límite de 100 amigos de ambas personas. */
    private Amistad confirmar(Amistad a, Long yo) {
        Long otro = a.otroDe(yo);
        if (amistadRepository.contarAmigos(yo, EstadoAmistad.ACEPTADA) >= MAX_AMIGOS) {
            throw new NegocioException(HttpStatus.CONFLICT, "Alcanzaste el límite de " + MAX_AMIGOS + " amigos");
        }
        if (amistadRepository.contarAmigos(otro, EstadoAmistad.ACEPTADA) >= MAX_AMIGOS) {
            throw new NegocioException(HttpStatus.CONFLICT, "Esa persona alcanzó su límite de amigos");
        }
        a.setEstado(EstadoAmistad.ACEPTADA);
        a.setFechaAmistad(LocalDateTime.now(clock));
        return amistadRepository.save(a);
    }

    @Transactional(readOnly = true)
    public Solicitudes listarSolicitudes(Long yo) {
        List<Amistad> recibidas = amistadRepository.findRecibidas(yo, EstadoAmistad.PENDIENTE);
        List<Amistad> enviadas = amistadRepository
                .findBySolicitanteIdAndEstadoOrderByFechaSolicitudDesc(yo, EstadoAmistad.PENDIENTE);
        List<Long> ids = new ArrayList<>();
        recibidas.forEach(a -> ids.add(a.getSolicitanteId()));
        enviadas.forEach(a -> ids.add(a.destinatarioId()));
        Map<Long, Usuario> usuarios = resumen.usuarios(ids);
        Map<Long, Map<String, String>> equipados = resumen.equipados(ids);
        return new Solicitudes(
                items(recibidas, usuarios, equipados, true),
                items(enviadas, usuarios, equipados, false));
    }

    private List<SolicitudItem> items(List<Amistad> filas, Map<Long, Usuario> usuarios,
            Map<Long, Map<String, String>> equipados, boolean recibidas) {
        List<SolicitudItem> out = new ArrayList<>();
        for (Amistad a : filas) {
            Usuario u = usuarios.get(recibidas ? a.getSolicitanteId() : a.destinatarioId());
            if (u != null) {
                out.add(new SolicitudItem(a.getId(), UsuarioResumenService.mini(u, equipados), a.getFechaSolicitud()));
            }
        }
        return out;
    }

    // ── Amigos ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Amigo> listarAmigos(Long yo) {
        List<Amistad> filas = amistadRepository.findAmigos(yo, EstadoAmistad.ACEPTADA);
        if (filas.isEmpty()) {
            return List.of();
        }
        List<Long> ids = filas.stream().map(a -> a.otroDe(yo)).toList();
        Map<Long, Usuario> usuarios = resumen.usuarios(ids);
        Map<Long, Map<String, String>> equipados = resumen.equipados(ids);
        Map<Long, Long> noLeidos = new HashMap<>();
        for (Object[] f : mensajeRepository.noLeidosPorRemitente(yo, ids)) {
            noLeidos.put(((Number) f[0]).longValue(), ((Number) f[1]).longValue());
        }
        List<Amigo> out = new ArrayList<>();
        for (Amistad a : filas) {
            Usuario u = usuarios.get(a.otroDe(yo));
            if (u == null) {
                continue;
            }
            int nivel = UsuarioResumenService.nivel(u);
            out.add(new Amigo(u.getId(), u.getUsername(), nivel, ReglasGamificacion.tituloRango(nivel),
                    equipados.getOrDefault(u.getId(), Map.of()), a.getFechaAmistad(),
                    noLeidos.getOrDefault(u.getId(), 0L)));
        }
        return out;
    }

    /** Elimina la amistad aceptada con {@code otroId}. Idempotente: si no eran amigos no pasa nada. */
    @Transactional
    public void eliminarAmigo(Long yo, Long otroId) {
        if (otroId == null || yo.equals(otroId)) {
            return;
        }
        amistadRepository.borrarParConEstado(menor(yo, otroId), mayor(yo, otroId), EstadoAmistad.ACEPTADA);
    }
}
