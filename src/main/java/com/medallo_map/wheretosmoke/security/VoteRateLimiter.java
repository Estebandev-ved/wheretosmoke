package com.medallo_map.wheretosmoke.security;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

import org.springframework.stereotype.Component;

/**
 * Limitador en memoria (ventana deslizante) para votos anonimos.
 * - Max {@code maxPorIp} votos por IP en la ventana.
 * - Max 1 voto por (spot + fingerprint + IP) en la ventana.
 * Se pierde al reiniciar y no se comparte entre instancias.
 */
@Component
public class VoteRateLimiter {

    private final int maxPorIp;
    private final long ventanaMs;
    private final LongSupplier reloj;
    private final Map<String, Deque<Long>> porIp = new ConcurrentHashMap<>();
    private final Map<String, Long> porSpotFp = new ConcurrentHashMap<>();

    public VoteRateLimiter() {
        this(10, Duration.ofHours(1), System::currentTimeMillis);
    }

    public VoteRateLimiter(int maxPorIp, Duration ventana, LongSupplier reloj) {
        this.maxPorIp = maxPorIp;
        this.ventanaMs = ventana.toMillis();
        this.reloj = reloj;
    }

    /** Devuelve true si el voto se permite (y lo registra); false si excede algun limite. */
    public boolean permitir(String ip, String fingerprint, Long spotId) {
        long ahora = reloj.getAsLong();
        if (porSpotFp.size() > 10000) { limpiar(); }
        String claveSpot = spotId + "|" + fingerprint + "|" + ip;
        boolean[] ok = { true };

        porSpotFp.compute(claveSpot, (k, ultimo) -> {
            if (ultimo != null && ahora - ultimo < ventanaMs) {
                ok[0] = false;
                return ultimo;
            }
            return ahora;
        });
        if (!ok[0]) {
            return false;
        }

        porIp.compute(ip, (k, cola) -> {
            Deque<Long> d = cola != null ? cola : new ArrayDeque<>();
            while (!d.isEmpty() && ahora - d.peekFirst() >= ventanaMs) {
                d.pollFirst();
            }
            if (d.size() >= maxPorIp) {
                ok[0] = false;
            } else {
                d.addLast(ahora);
            }
            return d;
        });
        if (!ok[0]) {
            porSpotFp.remove(claveSpot); // no consumir el cupo por-spot si se rechazo por IP
        }
        return ok[0];
    }

    /** Limpia entradas vencidas para acotar memoria. */
    public void limpiar() {
        long ahora = reloj.getAsLong();
        porSpotFp.values().removeIf(t -> ahora - t >= ventanaMs);
        porIp.entrySet().removeIf(e -> e.getValue().isEmpty() || ahora - e.getValue().peekLast() >= ventanaMs);
    }
}
