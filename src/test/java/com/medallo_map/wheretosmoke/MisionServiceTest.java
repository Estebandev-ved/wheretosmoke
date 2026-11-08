package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.medallo_map.wheretosmoke.dto.ReclamoMisionDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.AccionMision;
import com.medallo_map.wheretosmoke.model.Mision;
import com.medallo_map.wheretosmoke.model.MisionUsuario;
import com.medallo_map.wheretosmoke.model.TipoMision;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.MisionRepository;
import com.medallo_map.wheretosmoke.repository.MisionUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.service.MisionService;
import com.medallo_map.wheretosmoke.service.MonedasService;

class MisionServiceTest {

    private static final LocalDate HOY = LocalDate.of(2026, 11, 7);

    private MisionRepository misiones;
    private MisionUsuarioRepository progresos;
    private UsuarioRepository usuarios;
    private MonedasService monedas;
    private MisionService service;
    private Mision votar;

    @BeforeEach
    void setUp() {
        misiones = mock(MisionRepository.class);
        progresos = mock(MisionUsuarioRepository.class);
        usuarios = mock(UsuarioRepository.class);
        monedas = mock(MonedasService.class);
        Clock clock = Clock.fixed(Instant.parse("2026-11-07T15:00:00Z"), ZoneId.of("America/Bogota"));
        service = new MisionService(misiones, progresos, usuarios, monedas, clock);

        votar = Mision.builder().id(10L).codigo("DIA_VOTAR_3").tipo(TipoMision.DIARIA)
                .accion(AccionMision.VOTAR_SPOT).meta(3).recompensaXp(10).recompensaMonedas(5).activa(true).build();
        when(misiones.findById(10L)).thenReturn(Optional.of(votar));
        when(misiones.findByAccionAndActivaTrue(AccionMision.VOTAR_SPOT)).thenReturn(List.of(votar));
        when(usuarios.findById(1L)).thenReturn(Optional.of(Usuario.builder().id(1L).puntos(95).build()));
        when(monedas.acreditar(anyLong(), anyInt(), anyString(), anyString())).thenReturn(5);
    }

    private MisionUsuario fila(int progreso, boolean completada) {
        return MisionUsuario.builder().id(99L).usuarioId(1L).mision(votar).periodo(HOY)
                .progreso(progreso).completada(completada).build();
    }

    @Test
    void reclamarEsIdempotente() {
        when(progresos.findByUsuarioIdAndMisionIdAndPeriodo(1L, 10L, HOY)).thenReturn(Optional.of(fila(3, true)));
        when(progresos.marcarReclamada(99L)).thenReturn(1, 0); // la primera petición gana, la segunda no

        ReclamoMisionDTO r = service.reclamar(1L, 10L);
        assertEquals(5, r.getMonedasGanadas());
        assertEquals(10, r.getXpGanado());
        assertTrue(r.isSubioNivel()); // 95 + 10 XP cruza el umbral de 100 (nivel 2)

        NegocioException e = assertThrows(NegocioException.class, () -> service.reclamar(1L, 10L));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());

        verify(monedas, times(1)).acreditar(1L, 5, "MISION", "DIA_VOTAR_3");
        verify(usuarios, times(1)).sumarXp(1L, 10);
    }

    @Test
    void noSePuedeReclamarSinCompletar() {
        when(progresos.findByUsuarioIdAndMisionIdAndPeriodo(1L, 10L, HOY)).thenReturn(Optional.of(fila(2, false)));
        NegocioException e = assertThrows(NegocioException.class, () -> service.reclamar(1L, 10L));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());

        when(progresos.findByUsuarioIdAndMisionIdAndPeriodo(1L, 10L, HOY)).thenReturn(Optional.empty());
        assertThrows(NegocioException.class, () -> service.reclamar(1L, 10L));
        verify(monedas, never()).acreditar(anyLong(), anyInt(), anyString(), anyString());
    }

    @Test
    void progresoSeDetieneEnLaMeta() {
        MisionUsuario mu = fila(0, false);
        when(progresos.findByUsuarioIdAndMisionIdAndPeriodo(1L, 10L, HOY)).thenReturn(Optional.of(mu));
        for (int i = 0; i < 10; i++) {
            service.registrarAccion(1L, AccionMision.VOTAR_SPOT);
        }
        assertEquals(3, mu.getProgreso()); // tope diario anti-farmeo
        assertTrue(mu.isCompletada());
        verify(progresos, times(3)).save(any());
    }

    @Test
    void votoAnonimoNoCuentaYErroresNoRompenElFlujo() {
        service.registrarAccion(null, AccionMision.VOTAR_SPOT);
        verify(progresos, never()).save(any());

        when(misiones.findByAccionAndActivaTrue(AccionMision.VOTAR_SPOT)).thenThrow(new RuntimeException("BD caída"));
        service.registrarAccion(1L, AccionMision.VOTAR_SPOT); // no lanza
    }
}
