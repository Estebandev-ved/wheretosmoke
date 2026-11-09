package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.medallo_map.wheretosmoke.dto.CheckinDTO;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.service.CheckinService;
import com.medallo_map.wheretosmoke.service.MonedasService;

class CheckinServiceTest {

    private static final LocalDate HOY = LocalDate.of(2026, 11, 7);

    private UsuarioRepository repo;
    private MonedasService monedas;
    private CheckinService service;

    @BeforeEach
    void setUp() {
        repo = mock(UsuarioRepository.class);
        monedas = mock(MonedasService.class);
        Clock clock = Clock.fixed(Instant.parse("2026-11-07T15:00:00Z"), ZoneId.of("America/Bogota"));
        service = new CheckinService(repo, monedas, clock);
        when(repo.obtenerMonedas(1L)).thenReturn(40);
        when(repo.registrarCheckin(anyLong(), anyInt(), any())).thenReturn(1);
        when(monedas.acreditar(anyLong(), anyInt(), anyString(), anyString())).thenReturn(47);
    }

    private void usuario(LocalDate ultima, int racha) {
        Usuario u = Usuario.builder().id(1L).puntos(95).rachaDias(racha).ultimaActividad(ultima).build();
        when(repo.findById(1L)).thenReturn(Optional.of(u));
    }

    @Test
    void mismoDiaNoPagaDeNuevo() {
        usuario(HOY, 3);
        CheckinDTO r = service.checkin(1L);
        assertTrue(r.isYaHecho());
        assertEquals(0, r.getMonedasGanadas());
        assertEquals(3, r.getRachaDias());
        verify(monedas, never()).acreditar(anyLong(), anyInt(), anyString(), anyString());
        verify(repo, never()).registrarCheckin(anyLong(), anyInt(), any());
    }

    @Test
    void carreraParalelaPierdeElUpdateYNoPaga() {
        usuario(HOY.minusDays(1), 3);
        when(repo.registrarCheckin(1L, 4, HOY)).thenReturn(0);
        assertTrue(service.checkin(1L).isYaHecho());
        verify(monedas, never()).acreditar(anyLong(), anyInt(), anyString(), anyString());
    }

    @Test
    void diaSiguienteSumaRachaYPagaBono() {
        usuario(HOY.minusDays(1), 3);
        CheckinDTO r = service.checkin(1L);
        assertFalse(r.isYaHecho());
        assertEquals(4, r.getRachaDias());
        assertEquals(11, r.getMonedasGanadas()); // 5 + 2*3
        verify(repo).registrarCheckin(1L, 4, HOY);
        verify(monedas).acreditar(1L, 11, "CHECKIN", HOY.toString());
        verify(repo).sumarXp(1L, 10);
        assertEquals(105, r.getPuntos());
    }

    @Test
    void rachaRotaVuelveAUno() {
        usuario(HOY.minusDays(3), 8);
        CheckinDTO r = service.checkin(1L);
        assertEquals(1, r.getRachaDias());
        assertEquals(5, r.getMonedasGanadas());
        verify(repo).registrarCheckin(1L, 1, HOY);
    }

    @Test
    void primerCheckin() {
        usuario(null, 0);
        CheckinDTO r = service.checkin(1L);
        assertEquals(1, r.getRachaDias());
        assertEquals(7, r.getBonoManana());
    }

    @Test
    void horaFelizDuplicaXpYMonedasDelCheckin() {
        // 21:30 UTC = 16:30 en Bogotá (hora feliz de la tarde)
        Clock feliz = Clock.fixed(Instant.parse("2026-11-07T21:30:00Z"), ZoneId.of("America/Bogota"));
        CheckinService conEvento = new CheckinService(repo, monedas, feliz);
        usuario(HOY.minusDays(1), 3);

        CheckinDTO r = conEvento.checkin(1L);

        assertEquals(22, r.getMonedasGanadas()); // (5 + 2*3) x 2
        assertEquals(20, r.getXpGanado());
        assertEquals(2, r.getMultiplicador());
        verify(monedas).acreditar(1L, 22, "CHECKIN", HOY.toString());
        verify(repo).sumarXp(1L, 20);
        assertEquals(115, r.getPuntos());
    }
}
