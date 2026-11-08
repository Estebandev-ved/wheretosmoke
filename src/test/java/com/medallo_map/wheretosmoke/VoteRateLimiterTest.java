package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.Test;

import com.medallo_map.wheretosmoke.security.VoteRateLimiter;

class VoteRateLimiterTest {

    @Test
    void limitaPorIpYPorSpotFingerprint() {
        AtomicLong t = new AtomicLong(0);
        VoteRateLimiter l = new VoteRateLimiter(3, Duration.ofHours(1), t::get);

        assertTrue(l.permitir("1.1.1.1", "a", 1L));
        assertFalse(l.permitir("1.1.1.1", "a", 1L)); // mismo spot+fp+ip
        assertTrue(l.permitir("1.1.1.1", "b", 1L));
        assertTrue(l.permitir("1.1.1.1", "c", 1L));
        assertFalse(l.permitir("1.1.1.1", "d", 1L)); // 4to voto de la IP
        assertTrue(l.permitir("2.2.2.2", "d", 1L)); // otra IP

        t.set(Duration.ofHours(1).toMillis() + 1);
        assertTrue(l.permitir("1.1.1.1", "a", 1L)); // ventana vencida
    }
}
