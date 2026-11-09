package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
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
 *
 * Hora feliz 4:20: 04:20-05:20 y 16:20-17:20 (America/Bogota). XP y monedas del check-in,
 *   del reclamo de misión y del cofre diario valen x2.
 *
 * Cofre diario: 3% artículo cosmético, 55% monedas (3-30), 42% XP (5-25); los valores
 *   se inclinan a lo bajo (u^2) para que los premios grandes sean raros.
 *
 * Meta de círculo: objetivo semanal = max(10, 5 x miembros activos).
 * Álbum de comuna: se completa al visitar todos sus spots (mínimo 3 spots en la comuna).
 */
public final class ReglasGamificacion {

    public static final int NIVEL_MAX = 50;
    public static final int XP_CHECKIN = 10;
    private static final int BONO_BASE = 5;
    private static final int BONO_INCREMENTO = 2;
    private static final int BONO_TOPE = 25;

    // Hora feliz
    public static final int MULTIPLICADOR_HORA_FELIZ = 2;
    private static final LocalTime[] INICIOS_HORA_FELIZ = { LocalTime.of(4, 20), LocalTime.of(16, 20) };
    private static final Duration DURACION_HORA_FELIZ = Duration.ofHours(1);

    // Cofre diario
    public static final double PROB_COFRE_ARTICULO = 0.03;
    public static final double PROB_COFRE_MONEDAS = 0.55; // el resto (0.42) es XP
    private static final double UMBRAL_COFRE_MONEDAS = 0.58; // = ARTICULO + MONEDAS, sin error de coma flotante
    public static final int COFRE_MONEDAS_MIN = 3;
    public static final int COFRE_MONEDAS_MAX = 30;
    public static final int COFRE_XP_MIN = 5;
    public static final int COFRE_XP_MAX = 25;

    // Descubridor, álbum y círculos
    public static final int BONO_DESCUBRIDOR_MONEDAS = 30;
    public static final int BONO_DESCUBRIDOR_XP = 40;
    public static final int BONO_ALBUM_MONEDAS = 50;
    public static final int ALBUM_MIN_SPOTS = 3;
    public static final int META_CIRCULO_MIN = 10;
    public static final int META_CIRCULO_POR_MIEMBRO = 5;
    public static final int META_CIRCULO_MONEDAS = 40;
    public static final int META_CIRCULO_XP = 30;

    public enum TipoCofre {
        MONEDAS, XP, ARTICULO
    }

    /** Premio sorteado del cofre. Para ARTICULO, monedas y xp son 0 (el servicio elige el artículo). */
    public record PremioCofre(TipoCofre tipo, int monedas, int xp) {
    }

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

    // ── Hora feliz 4:20 ──────────────────────────────────────────────

    private static ZonedDateTime inicioDe(ZonedDateTime ref, int indice, int diasOffset) {
        return ref.toLocalDate().plusDays(diasOffset).atTime(INICIOS_HORA_FELIZ[indice]).atZone(ref.getZone());
    }

    public static boolean horaFelizActiva(Clock clock) {
        return segundosRestantesHoraFeliz(clock) > 0;
    }

    /** 2 durante la hora feliz, 1 el resto del día. */
    public static int multiplicadorEvento(Clock clock) {
        return horaFelizActiva(clock) ? MULTIPLICADOR_HORA_FELIZ : 1;
    }

    /** Segundos que faltan para que termine la hora feliz en curso; 0 si no hay una activa. */
    public static long segundosRestantesHoraFeliz(Clock clock) {
        ZonedDateTime ahora = ZonedDateTime.now(clock);
        for (int i = 0; i < INICIOS_HORA_FELIZ.length; i++) {
            ZonedDateTime inicio = inicioDe(ahora, i, 0);
            ZonedDateTime fin = inicio.plus(DURACION_HORA_FELIZ);
            if (!ahora.isBefore(inicio) && ahora.isBefore(fin)) {
                return Duration.between(ahora, fin).getSeconds();
            }
        }
        return 0;
    }

    /** Inicio de la próxima hora feliz (estrictamente posterior a ahora, aunque haya una activa). */
    public static ZonedDateTime proximoInicioHoraFeliz(Clock clock) {
        ZonedDateTime ahora = ZonedDateTime.now(clock);
        for (int i = 0; i < INICIOS_HORA_FELIZ.length; i++) {
            ZonedDateTime inicio = inicioDe(ahora, i, 0);
            if (inicio.isAfter(ahora)) {
                return inicio;
            }
        }
        return inicioDe(ahora, 0, 1);
    }

    public static long segundosParaProximaHoraFeliz(Clock clock) {
        return Duration.between(ZonedDateTime.now(clock), proximoInicioHoraFeliz(clock)).getSeconds();
    }

    // ── Cofre diario ─────────────────────────────────────────────────

    /** Monedas del cofre (3..30) a partir de un número uniforme en [0,1). */
    public static int monedasCofre(double r) {
        return valorInclinado(r, COFRE_MONEDAS_MIN, COFRE_MONEDAS_MAX);
    }

    /** XP del cofre (5..25) a partir de un número uniforme en [0,1). */
    public static int xpCofre(double r) {
        return valorInclinado(r, COFRE_XP_MIN, COFRE_XP_MAX);
    }

    private static int valorInclinado(double r, int min, int max) {
        double u = Math.max(0, Math.min(r, 0.999999999));
        return min + (int) Math.floor((max - min + 1) * u * u);
    }

    /** Tipo y valor del premio. rTipo y rValor son uniformes en [0,1). */
    public static PremioCofre sortearCofre(double rTipo, double rValor) {
        if (rTipo < PROB_COFRE_ARTICULO) {
            return new PremioCofre(TipoCofre.ARTICULO, 0, 0);
        }
        if (rTipo < UMBRAL_COFRE_MONEDAS) {
            return new PremioCofre(TipoCofre.MONEDAS, monedasCofre(rValor), 0);
        }
        return new PremioCofre(TipoCofre.XP, 0, xpCofre(rValor));
    }

    // ── Círculos y álbum ─────────────────────────────────────────────

    /** Objetivo semanal de visitas del círculo: 5 por miembro activo, mínimo 10. */
    public static int objetivoMetaCirculo(int miembrosActivos) {
        return Math.max(META_CIRCULO_MIN, META_CIRCULO_POR_MIEMBRO * Math.max(0, miembrosActivos));
    }

    /** Álbum completo: visitó todos los spots de la comuna y la comuna tiene al menos 3. */
    public static boolean albumCompleto(long totalSpots, long visitados) {
        return totalSpots >= ALBUM_MIN_SPOTS && visitados >= totalSpots;
    }
}
