package com.medallo_map.wheretosmoke.security;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

import org.springframework.stereotype.Component;

/**
 * Limitador en memoria (ventana deslizante) de mensajes privados: máx. {@code max} por usuario en la ventana
 * (30 por minuto por defecto). Se pierde al reiniciar y no se comparte entre instancias.
 */
@Component
public class MensajeRateLimiter {

    private final int max;
    private final long ventanaMs;
    private final LongSupplier reloj;
    private final Map<Long, Deque<Long>> porUsuario = new ConcurrentHashMap<>();

    public MensajeRateLimiter() {
        this(30, Duration.ofMinutes(1), System::currentTimeMillis);
    }

    public MensajeRateLimiter(int max, Duration ventana, LongSupplier reloj) {
        this.max = max;
        this.ventanaMs = ventana.toMillis();
        this.reloj = reloj;
    }

    /** true si el envío se permite (y lo registra); false si el usuario ya llegó al límite de la ventana. */
    public boolean permitir(Long usuarioId) {
        long ahora = reloj.getAsLong();
        if (porUsuario.size() > 10000) {
            limpiar();
        }
        boolean[] ok = { true };
        porUsuario.compute(usuarioId, (k, cola) -> {
            Deque<Long> d = cola != null ? cola : new ArrayDeque<>();
            while (!d.isEmpty() && ahora - d.peekFirst() >= ventanaMs) {
                d.pollFirst();
            }
            if (d.size() >= max) {
                ok[0] = false;
            } else {
                d.addLast(ahora);
            }
            return d;
        });
        return ok[0];
    }

    /** Limpia entradas vencidas para acotar memoria. */
    public void limpiar() {
        long ahora = reloj.getAsLong();
        porUsuario.entrySet().removeIf(e -> e.getValue().isEmpty() || ahora - e.getValue().peekLast() >= ventanaMs);
    }
}
