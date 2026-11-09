package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

import com.medallo_map.wheretosmoke.dto.EventoDTO;
import com.medallo_map.wheretosmoke.service.ComunasMedellin;
import com.medallo_map.wheretosmoke.service.ReglasGamificacion;
import com.medallo_map.wheretosmoke.service.ReglasGamificacion.PremioCofre;
import com.medallo_map.wheretosmoke.service.ReglasGamificacion.TipoCofre;

/** Reglas puras nuevas: hora feliz, cofre, meta de círculo, álbum y comunas. */
class ReglasNuevasTest {

    private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");

    /** Reloj fijo a una hora local de Bogotá del 7/nov/2026. */
    private static Clock a(String horaLocal) {
        return Clock.fixed(Instant.parse("2026-11-07T" + horaLocal + "Z").plusSeconds(5 * 3600), BOGOTA);
    }

    @Test
    void horaFelizSoloEnLasDosVentanas() {
        assertEquals(1, ReglasGamificacion.multiplicadorEvento(a("04:19:59")));
        assertEquals(2, ReglasGamificacion.multiplicadorEvento(a("04:20:00")));
        assertEquals(2, ReglasGamificacion.multiplicadorEvento(a("05:19:59")));
        assertEquals(1, ReglasGamificacion.multiplicadorEvento(a("05:20:00")));
        assertEquals(1, ReglasGamificacion.multiplicadorEvento(a("12:00:00")));
        assertEquals(1, ReglasGamificacion.multiplicadorEvento(a("16:19:59")));
        assertEquals(2, ReglasGamificacion.multiplicadorEvento(a("16:20:00")));
        assertEquals(2, ReglasGamificacion.multiplicadorEvento(a("17:19:59")));
        assertEquals(1, ReglasGamificacion.multiplicadorEvento(a("17:20:00")));
        assertEquals(1, ReglasGamificacion.multiplicadorEvento(a("23:59:59")));
    }

    @Test
    void segundosParaLaProximaHoraFeliz() {
        // 00:00 -> faltan 4h20m para las 04:20
        assertEquals(4 * 3600 + 20 * 60, ReglasGamificacion.segundosParaProximaHoraFeliz(a("00:00:00")));
        // 10:00 -> próxima 16:20
        assertEquals(6 * 3600 + 20 * 60, ReglasGamificacion.segundosParaProximaHoraFeliz(a("10:00:00")));
        // 18:00 -> mañana 04:20 = 10h20m
        assertEquals(10 * 3600 + 20 * 60, ReglasGamificacion.segundosParaProximaHoraFeliz(a("18:00:00")));
        // activa a las 04:30 -> la próxima es la de la tarde (11h50m)
        assertEquals(11 * 3600 + 50 * 60, ReglasGamificacion.segundosParaProximaHoraFeliz(a("04:30:00")));
    }

    @Test
    void segundosRestantesSoloSiEstaActiva() {
        assertEquals(0, ReglasGamificacion.segundosRestantesHoraFeliz(a("10:00:00")));
        assertEquals(30 * 60, ReglasGamificacion.segundosRestantesHoraFeliz(a("16:50:00")));
        assertEquals(1, ReglasGamificacion.segundosRestantesHoraFeliz(a("05:19:59")));
    }

    @Test
    void eventoDtoActivoEInactivo() {
        EventoDTO activo = EventoDTO.de(a("16:30:00"));
        assertTrue(activo.isActivo());
        assertEquals(2, activo.getMultiplicador());
        assertEquals(50 * 60, activo.getSegundosRestantes());
        assertEquals("2026-11-08T04:20:00-05:00", activo.getProximaInicioIso());
        assertEquals(11 * 3600 + 50 * 60, activo.getSegundosParaProxima());

        EventoDTO inactivo = EventoDTO.de(a("10:00:00"));
        assertFalse(inactivo.isActivo());
        assertEquals(1, inactivo.getMultiplicador());
        assertEquals(0, inactivo.getSegundosRestantes());
        assertEquals("2026-11-07T16:20:00-05:00", inactivo.getProximaInicioIso());
    }

    @Test
    void cofrePonderadoPorTipo() {
        assertEquals(TipoCofre.ARTICULO, ReglasGamificacion.sortearCofre(0.0, 0.5).tipo());
        assertEquals(TipoCofre.ARTICULO, ReglasGamificacion.sortearCofre(0.029, 0.5).tipo());
        assertEquals(TipoCofre.MONEDAS, ReglasGamificacion.sortearCofre(0.03, 0.5).tipo());
        assertEquals(TipoCofre.MONEDAS, ReglasGamificacion.sortearCofre(0.579, 0.5).tipo());
        assertEquals(TipoCofre.XP, ReglasGamificacion.sortearCofre(0.58, 0.5).tipo());
        assertEquals(TipoCofre.XP, ReglasGamificacion.sortearCofre(0.999, 0.5).tipo());
    }

    @Test
    void cofreRespetaRangosDeValor() {
        assertEquals(3, ReglasGamificacion.monedasCofre(0.0));
        assertEquals(30, ReglasGamificacion.monedasCofre(0.999999));
        assertEquals(5, ReglasGamificacion.xpCofre(0.0));
        assertEquals(25, ReglasGamificacion.xpCofre(0.999999));
        assertEquals(3, ReglasGamificacion.monedasCofre(-1)); // entradas fuera de rango no rompen
        assertEquals(30, ReglasGamificacion.monedasCofre(7));
        for (double r = 0; r < 1; r += 0.001) {
            int m = ReglasGamificacion.monedasCofre(r);
            int x = ReglasGamificacion.xpCofre(r);
            assertTrue(m >= 3 && m <= 30, "monedas fuera de rango: " + m);
            assertTrue(x >= 5 && x <= 25, "xp fuera de rango: " + x);
        }
        PremioCofre p = ReglasGamificacion.sortearCofre(0.1, 0.0);
        assertEquals(new PremioCofre(TipoCofre.MONEDAS, 3, 0), p);
    }

    @Test
    void objetivoDeLaMetaDelCirculo() {
        assertEquals(10, ReglasGamificacion.objetivoMetaCirculo(0));
        assertEquals(10, ReglasGamificacion.objetivoMetaCirculo(1));
        assertEquals(10, ReglasGamificacion.objetivoMetaCirculo(2));
        assertEquals(15, ReglasGamificacion.objetivoMetaCirculo(3));
        assertEquals(40, ReglasGamificacion.objetivoMetaCirculo(8));
    }

    @Test
    void albumExigeTresSpotsYVisitarTodos() {
        assertFalse(ReglasGamificacion.albumCompleto(0, 0));
        assertFalse(ReglasGamificacion.albumCompleto(2, 2)); // comuna con pocos spots no cuenta
        assertFalse(ReglasGamificacion.albumCompleto(5, 4));
        assertTrue(ReglasGamificacion.albumCompleto(3, 3));
        assertTrue(ReglasGamificacion.albumCompleto(5, 5));
    }

    @Test
    void comunaPorCentroMasCercano() {
        assertEquals("El Poblado", ComunasMedellin.asignar(6.2100, -75.5700));
        assertEquals("La Candelaria", ComunasMedellin.asignar(6.2490, -75.5650)); // centro
        assertEquals("Laureles-Estadio", ComunasMedellin.asignar(6.2540, -75.5910));
        assertEquals("San Antonio de Prado", ComunasMedellin.asignar(6.1850, -75.6560));
        assertEquals("Popular", ComunasMedellin.asignar(6.2960, -75.5430)); // exacto sobre el centro
    }

    @Test
    void comunaNulaSiFaltanCoordenadasOEstaMuyLejos() {
        assertNull(ComunasMedellin.asignar(null, -75.5));
        assertNull(ComunasMedellin.asignar(6.2, null));
        assertNull(ComunasMedellin.asignar(4.7110, -74.0721)); // Bogotá
    }

    @Test
    void catalogoDeComunasCompletoYSelloEstable() {
        assertEquals(21, ComunasMedellin.TODAS.size()); // 16 comunas + 5 corregimientos
        assertEquals("SELLO_EL_POBLADO", ComunasMedellin.sello("El Poblado"));
        assertEquals("SELLO_LA_AMERICA", ComunasMedellin.sello("La América"));
        assertEquals("SELLO_LAURELES_ESTADIO", ComunasMedellin.sello("Laureles-Estadio"));
        assertTrue(ComunasMedellin.existe("Belén"));
        assertFalse(ComunasMedellin.existe("Narnia"));
    }
}
