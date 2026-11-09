package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.medallo_map.wheretosmoke.dto.SocialDTO.Conversacion;
import com.medallo_map.wheretosmoke.dto.SocialDTO.MensajeDTO;
import com.medallo_map.wheretosmoke.dto.SocialDTO.PaginaMensajes;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.MensajePrivado;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.BloqueoRepository;
import com.medallo_map.wheretosmoke.repository.MensajePrivadoRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.security.MensajeRateLimiter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * MENSAJES PRIVADOS (solo entre amigos). El texto se guarda tal cual y nunca se interpreta como HTML.
 * Tiempo real: tras confirmar la transacción se publica en la cola de usuario /user/queue/mensajes del
 * destinatario (el nombre del Principal STOMP es el id del usuario, ver WebSocketConfig).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MensajePrivadoService {

    public static final int MAX_TEXTO = 500;
    public static final int LIMITE_DEFECTO = 30;
    public static final int LIMITE_MAX = 50;
    public static final int RESUMEN_MAX = 80;
    public static final String COLA = "/queue/mensajes";

    private final MensajePrivadoRepository mensajeRepository;
    private final BloqueoRepository bloqueoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AmistadService amistadService;
    private final UsuarioResumenService resumen;
    private final MensajeRateLimiter rateLimiter;
    private final SimpMessagingTemplate messagingTemplate;
    private final Clock clock;

    // ── Enviar ───────────────────────────────────────────────────────────────

    @Transactional
    public MensajeDTO enviar(Long yo, Long paraId, String texto) {
        String limpio = texto == null ? "" : texto.trim();
        if (limpio.isEmpty()) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "El mensaje no puede estar vacío");
        }
        if (limpio.length() > MAX_TEXTO) {
            throw new NegocioException(HttpStatus.BAD_REQUEST,
                    "El mensaje no puede superar " + MAX_TEXTO + " caracteres");
        }
        exigirAmigos(yo, paraId, "Solo puedes enviar mensajes a tus amigos");
        Usuario destino = usuarioRepository.findById(paraId).orElse(null);
        if (destino == null || !destino.isActivo()) {
            throw new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        if (!rateLimiter.permitir(yo)) {
            throw new NegocioException(HttpStatus.TOO_MANY_REQUESTS,
                    "Estás enviando mensajes muy rápido. Espera un momento.");
        }
        MensajePrivado guardado = mensajeRepository.save(MensajePrivado.builder()
                .usuarioMenor(AmistadService.menor(yo, paraId)).usuarioMayor(AmistadService.mayor(yo, paraId))
                .deId(yo).paraId(paraId).texto(limpio).fecha(LocalDateTime.now(clock)).leido(false).build());
        MensajeDTO dto = aDto(guardado);
        trasCommit(() -> messagingTemplate.convertAndSendToUser(String.valueOf(paraId), COLA, dto));
        return dto;
    }

    // ── Leer ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PaginaMensajes listar(Long yo, Long otroId, Long antes, Integer limite) {
        exigirAmigos(yo, otroId, "Solo puedes ver conversaciones con tus amigos");
        int n = limite == null ? LIMITE_DEFECTO : Math.max(1, Math.min(limite, LIMITE_MAX));
        PageRequest pagina = PageRequest.of(0, n + 1); // uno extra para saber si hay más
        Long menor = AmistadService.menor(yo, otroId);
        Long mayor = AmistadService.mayor(yo, otroId);
        List<MensajePrivado> filas = antes == null
                ? mensajeRepository.ultimos(menor, mayor, pagina)
                : mensajeRepository.anteriores(menor, mayor, antes, pagina);
        boolean hayMas = filas.size() > n;
        List<MensajePrivado> pagina2 = new ArrayList<>(hayMas ? filas.subList(0, n) : filas);
        Collections.reverse(pagina2); // vienen del más nuevo al más viejo; se entregan en orden cronológico
        return new PaginaMensajes(pagina2.stream().map(MensajePrivadoService::aDto).toList(), hayMas);
    }

    @Transactional(readOnly = true)
    public List<Conversacion> conversaciones(Long yo) {
        Set<Long> amigos = amistadService.idsAmigos(yo);
        if (amigos.isEmpty()) {
            return List.of();
        }
        List<MensajePrivado> ultimos = mensajeRepository.ultimosPorConversacion(yo).stream()
                .filter(m -> amigos.contains(otro(m, yo))).toList();
        if (ultimos.isEmpty()) {
            return List.of();
        }
        List<Long> ids = ultimos.stream().map(m -> otro(m, yo)).toList();
        Map<Long, Usuario> usuarios = resumen.usuarios(ids);
        Map<Long, Map<String, String>> equipados = resumen.equipados(ids);
        Map<Long, Long> noLeidos = new HashMap<>();
        for (Object[] f : mensajeRepository.noLeidosPorRemitente(yo, ids)) {
            noLeidos.put(((Number) f[0]).longValue(), ((Number) f[1]).longValue());
        }
        List<Conversacion> out = new ArrayList<>();
        for (MensajePrivado m : ultimos) {
            Long otroId = otro(m, yo);
            Usuario u = usuarios.get(otroId);
            if (u == null) {
                continue;
            }
            out.add(new Conversacion(UsuarioResumenService.mini(u, equipados), resumir(m.getTexto()),
                    m.getFecha(), noLeidos.getOrDefault(otroId, 0L), m.getDeId().equals(yo)));
        }
        return out; // ya viene ordenada por id descendente (= fecha descendente)
    }

    @Transactional(readOnly = true)
    public long totalNoLeidos(Long yo) {
        Set<Long> amigos = amistadService.idsAmigos(yo);
        return amigos.isEmpty() ? 0 : mensajeRepository.countByParaIdAndLeidoFalseAndDeIdIn(yo, amigos);
    }

    /** Marca como leídos los mensajes recibidos de {@code otroId} y avisa en vivo al remitente. */
    @Transactional
    public int marcarLeidos(Long yo, Long otroId) {
        int n = mensajeRepository.marcarLeidos(yo, otroId);
        if (n > 0 && !bloqueoRepository.existeEntre(yo, otroId)) {
            Map<String, Object> evento = Map.of("tipo", "leido", "deId", yo);
            trasCommit(() -> messagingTemplate.convertAndSendToUser(String.valueOf(otroId), COLA, evento));
        }
        return n;
    }

    // ── Auxiliares ───────────────────────────────────────────────────────────

    private void exigirAmigos(Long yo, Long otroId, String mensaje) {
        if (yo.equals(otroId)) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "No puedes enviarte mensajes a ti mismo");
        }
        if (bloqueoRepository.existeEntre(yo, otroId) || !amistadService.sonAmigos(yo, otroId)) {
            throw new NegocioException(HttpStatus.FORBIDDEN, mensaje);
        }
    }

    private static Long otro(MensajePrivado m, Long yo) {
        return m.getDeId().equals(yo) ? m.getParaId() : m.getDeId();
    }

    static MensajeDTO aDto(MensajePrivado m) {
        return new MensajeDTO(m.getId(), m.getDeId(), m.getParaId(), m.getTexto(), m.getFecha(), m.isLeido());
    }

    /** Recorta a 80 caracteres sin partir un par sustituto (emoji). */
    static String resumir(String texto) {
        if (texto.length() <= RESUMEN_MAX) {
            return texto;
        }
        int fin = RESUMEN_MAX;
        if (Character.isHighSurrogate(texto.charAt(fin - 1))) {
            fin--;
        }
        return texto.substring(0, fin);
    }

    /** Publica por WebSocket solo si la transacción se confirmó; un fallo del broker no rompe la petición. */
    private void trasCommit(Runnable envio) {
        Runnable seguro = () -> {
            try {
                envio.run();
            } catch (Exception e) {
                log.warn("No se pudo publicar el evento de mensajería privada: {}", e.getMessage());
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    seguro.run();
                }
            });
        } else {
            seguro.run();
        }
    }
}
