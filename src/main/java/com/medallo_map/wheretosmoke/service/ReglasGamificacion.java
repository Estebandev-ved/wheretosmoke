package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;

/**
 * REGLAS PURAS DE GAMIFICACIÓN (sin Spring ni BD, fáciles de probar).
 *
 * Nivel: la columna usuarios.puntos es el XP total.
 *   XP acumulado para ALCANZAR el nivel n  =  50 * n * (n - 1)
 *   nivel 1 = 0 XP, 2 = 100, 3 = 300, 4 = 600, 5 = 1000, 6 = 1500, 10 = 4500 ...
 *   (cada nivel cuesta 100 XP más que el anterior). Tope: nivel 50.
 *
 * Racha: check-in diario (America/Bogota). Mismo día = sin cambio; día siguiente = +1;
 *   si pasó más de un día se reinicia a 1.
 *
 * Bono de check-in (monedas): 5 el día 1, +2 por día de racha, tope 25 (desde el día 11).
 */
public final class ReglasGamificacion {

    public static final int NIVEL_MAX = 50;
    public static final int XP_CHECKIN = 10;
    private static final int BONO_BASE = 5;
    private static final int BONO_INCREMENTO = 2;
    private static final int BONO_TOPE = 25;

    private ReglasGamificacion() {
    }

    /** XP total necesario para alcanzar el nivel n (n >= 1). */
    public static int xpParaNivel(int nivel) {
        if (nivel <= 1) {
            return 0;
        }
        return 50 * nivel * (nivel - 1);
    }

    /** Nivel (1..NIVEL_MAX) correspondiente a un XP total. XP nulo o negativo = nivel 1. */
    public static int nivelPara(Integer xp) {
        if (xp == null || xp <= 0) {
            return 1;
        }
        int n = (int) ((1 + Math.sqrt(1 + 0.08 * xp)) / 2);
        // Corrección por redondeo de coma flotante
        while (n < NIVEL_MAX && xpParaNivel(n + 1) <= xp) {
            n++;
        }
        while (n > 1 && xpParaNivel(n) > xp) {
            n--;
        }
        return Math.max(1, Math.min(n, NIVEL_MAX));
    }

    /** Título de rango según el nivel. */
    public static String tituloRango(int nivel) {
        if (nivel >= 30) return "Leyenda de Medallo";
        if (nivel >= 18) return "Cacique Paisa";
        if (nivel >= 12) return "Maestro del Parche";
        if (nivel >= 8) return "Guardián del Parche";
        if (nivel >= 5) return "Parcero de Barrio";
        if (nivel >= 3) return "Explorador Paisa";
        return "Novato";
    }

    /** Racha resultante de hacer check-in hoy. */
    public static int nuevaRacha(LocalDate ultimaActividad, LocalDate hoy, Integer rachaActual) {
        int actual = rachaActual == null ? 0 : Math.max(0, rachaActual);
        if (ultimaActividad == null) {
            return 1;
        }
        if (!ultimaActividad.isBefore(hoy)) { // mismo día (o reloj desfasado): no cambia
            return Math.max(1, actual);
        }
        if (ultimaActividad.equals(hoy.minusDays(1))) {
            return actual + 1;
        }
        return 1; // se rompió la racha
    }

    /** Racha que se muestra hoy: 0 si ya pasó más de un día sin check-in. */
    public static int rachaVigente(LocalDate ultimaActividad, LocalDate hoy, Integer rachaActual) {
        if (ultimaActividad == null || rachaActual == null) {
            return 0;
        }
        return ultimaActividad.isBefore(hoy.minusDays(1)) ? 0 : rachaActual;
    }

    /** Monedas del check-in para el día n de racha (n >= 1). */
    public static int bonoMonedasRacha(int diaRacha) {
        int dia = Math.max(1, diaRacha);
        return Math.min(BONO_BASE + BONO_INCREMENTO * (dia - 1), BONO_TOPE);
    }

    /** Fecha de inicio del periodo diario (hoy) en la zona del reloj. */
    public static LocalDate periodoDiario(Clock clock) {
        return LocalDate.now(clock);
    }

    /** Lunes de la semana actual. */
    public static LocalDate periodoSemanal(Clock clock) {
        return LocalDate.now(clock).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    public static long segundosHastaFinDia(Clock clock) {
        ZonedDateTime ahora = ZonedDateTime.now(clock);
        ZonedDateTime manana = ahora.toLocalDate().plusDays(1).atStartOfDay(ahora.getZone());
        return Duration.between(ahora, manana).getSeconds();
    }

    public static long segundosHastaFinSemana(Clock clock) {
        ZonedDateTime ahora = ZonedDateTime.now(clock);
        ZonedDateTime lunes = ahora.toLocalDate().with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .atStartOfDay(ahora.getZone());
        return Duration.between(ahora, lunes).getSeconds();
    }
}
