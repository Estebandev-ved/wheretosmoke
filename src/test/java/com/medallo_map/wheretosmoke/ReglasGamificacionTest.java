package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

import com.medallo_map.wheretosmoke.service.ReglasGamificacion;

class ReglasGamificacionTest {

    @Test
    void curvaDeNivelEnLosUmbrales() {
        assertEquals(1, ReglasGamificacion.nivelPara(null));
        assertEquals(1, ReglasGamificacion.nivelPara(-5));
        assertEquals(1, ReglasGamificacion.nivelPara(99));
        assertEquals(2, ReglasGamificacion.nivelPara(100));
        assertEquals(2, ReglasGamificacion.nivelPara(299));
        assertEquals(3, ReglasGamificacion.nivelPara(300));
        assertEquals(4, ReglasGamificacion.nivelPara(600));
        assertEquals(5, ReglasGamificacion.nivelPara(1000));
        assertEquals(ReglasGamificacion.NIVEL_MAX, ReglasGamificacion.nivelPara(Integer.MAX_VALUE));
    }

    @Test
    void nivelEsConsistenteConXpParaNivel() {
        for (int n = 1; n <= ReglasGamificacion.NIVEL_MAX; n++) {
            int xp = ReglasGamificacion.xpParaNivel(n);
            assertEquals(n, ReglasGamificacion.nivelPara(xp), "umbral del nivel " + n);
            if (n > 1) {
                assertEquals(n - 1, ReglasGamificacion.nivelPara(xp - 1), "justo antes del nivel " + n);
            }
        }
    }

    @Test
    void titulosDeRango() {
        assertEquals("Novato", ReglasGamificacion.tituloRango(1));
        assertEquals("Explorador Paisa", ReglasGamificacion.tituloRango(3));
        assertEquals("Leyenda de Medallo", ReglasGamificacion.tituloRango(50));
    }

    @Test
    void rachaMismoDiaSiguienteDiaYRota() {
        LocalDate hoy = LocalDate.of(2026, 11, 7);
        assertEquals(1, ReglasGamificacion.nuevaRacha(null, hoy, 0));
        assertEquals(4, ReglasGamificacion.nuevaRacha(hoy, hoy, 4)); // mismo día: sin cambio
        assertEquals(5, ReglasGamificacion.nuevaRacha(hoy.minusDays(1), hoy, 4)); // día siguiente
        assertEquals(1, ReglasGamificacion.nuevaRacha(hoy.minusDays(2), hoy, 9)); // rota
        assertEquals(0, ReglasGamificacion.rachaVigente(hoy.minusDays(2), hoy, 9));
        assertEquals(9, ReglasGamificacion.rachaVigente(hoy.minusDays(1), hoy, 9));
    }

    @Test
    void bonoCrecienteConTope() {
        assertEquals(5, ReglasGamificacion.bonoMonedasRacha(1));
        assertEquals(7, ReglasGamificacion.bonoMonedasRacha(2));
        assertEquals(25, ReglasGamificacion.bonoMonedasRacha(11));
        assertEquals(25, ReglasGamificacion.bonoMonedasRacha(500));
    }

    @Test
    void periodosYReinicioEnBogota() {
        // 2026-11-07 es sábado; 23:00 en Bogotá = 04:00Z del domingo
        Clock clock = Clock.fixed(Instant.parse("2026-11-08T04:00:00Z"), ZoneId.of("America/Bogota"));
        assertEquals(LocalDate.of(2026, 11, 7), ReglasGamificacion.periodoDiario(clock));
        assertEquals(LocalDate.of(2026, 11, 2), ReglasGamificacion.periodoSemanal(clock)); // lunes
        assertEquals(3600, ReglasGamificacion.segundosHastaFinDia(clock));
        assertEquals(3600 + 24 * 3600, ReglasGamificacion.segundosHastaFinSemana(clock));
        assertTrue(ReglasGamificacion.segundosHastaFinSemana(clock) > ReglasGamificacion.segundosHastaFinDia(clock));
    }
}
