package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
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
import java.util.List;
import java.util.Optional;
import java.util.Random;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.medallo_map.wheretosmoke.dto.CofreDTO;
import com.medallo_map.wheretosmoke.model.ArticuloTienda;
import com.medallo_map.wheretosmoke.model.CategoriaArticulo;
import com.medallo_map.wheretosmoke.model.InventarioUsuario;
import com.medallo_map.wheretosmoke.model.RarezaArticulo;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.ArticuloTiendaRepository;
import com.medallo_map.wheretosmoke.repository.InventarioUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.service.CofreService;
import com.medallo_map.wheretosmoke.service.MonedasService;

class CofreServiceTest {

    private static final LocalDate HOY = LocalDate.of(2026, 11, 7);
    private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");

    private UsuarioRepository usuarios;
    private ArticuloTiendaRepository articulos;
    private InventarioUsuarioRepository inventario;
    private MonedasService monedas;

    @BeforeEach
    void setUp() {
        usuarios = mock(UsuarioRepository.class);
        articulos = mock(ArticuloTiendaRepository.class);
        inventario = mock(InventarioUsuarioRepository.class);
        monedas = mock(MonedasService.class);
        when(usuarios.obtenerMonedas(1L)).thenReturn(40);
        when(usuarios.registrarCofre(1L, HOY)).thenReturn(1);
        when(monedas.acreditar(anyLong(), anyInt(), anyString(), anyString())).thenAnswer(i -> 40 + (int) i.getArgument(1));
        when(inventario.findByUsuarioId(1L)).thenReturn(List.of());
    }

    private void usuario(LocalDate ultimoCofre, int puntos) {
        Usuario u = Usuario.builder().id(1L).puntos(puntos).ultimoCofre(ultimoCofre).build();
        when(usuarios.findById(1L)).thenReturn(Optional.of(u));
    }

    /** Random determinista: devuelve los doubles en orden (tipo, valor) y nextInt fijo. */
    private static Random azar(int nextInt, double... valores) {
        return new Random() {
            private int i = 0;

            @Override
            public double nextDouble() {
                return valores[i++ % valores.length];
            }

            @Override
            public int nextInt(int bound) {
                return nextInt % bound;
            }
        };
    }

    private CofreService servicio(Random random, String horaUtc) {
        Clock clock = Clock.fixed(Instant.parse("2026-11-07T" + horaUtc + "Z"), BOGOTA);
        return new CofreService(usuarios, articulos, inventario, monedas, clock, random);
    }

    @Test
    void premioDeMonedasSeAcreditaYMarcaElDia() {
        usuario(null, 95);
        CofreDTO r = servicio(azar(0, 0.10, 0.0), "15:00:00").abrir(1L); // 10:00 Bogotá, sin evento

        assertFalse(r.isYaAbierto());
        assertEquals("MONEDAS", r.getTipo());
        assertEquals(3, r.getMonedas());
        assertEquals(0, r.getXp());
        assertNull(r.getArticulo());
        assertEquals(43, r.getSaldoMonedas());
        assertEquals(1, r.getMultiplicador());
        assertTrue(r.getSegundosParaSiguiente() > 0);
        verify(usuarios).registrarCofre(1L, HOY);
        verify(monedas).acreditar(1L, 3, "COFRE", HOY.toString());
        verify(usuarios, never()).sumarXp(anyLong(), anyInt());
    }

    @Test
    void premioDeXpSumaPuntosYPuedeSubirNivel() {
        usuario(null, 95);
        CofreDTO r = servicio(azar(0, 0.90, 0.5), "15:00:00").abrir(1L);

        assertEquals("XP", r.getTipo());
        assertEquals(10, r.getXp()); // 5 + floor(21 * 0.25) = 10
        assertEquals(105, r.getPuntos());
        assertTrue(r.isSubioNivel()); // 105 cruza los 100 XP del nivel 2
        verify(usuarios).sumarXp(1L, 10);
        verify(monedas, never()).acreditar(anyLong(), anyInt(), anyString(), anyString());
    }

    @Test
    void horaFelizDuplicaElPremio() {
        usuario(null, 0);
        // 09:30 UTC = 04:30 Bogotá: dentro de la hora feliz
        when(usuarios.registrarCofre(1L, HOY)).thenReturn(1);
        CofreDTO r = servicio(azar(0, 0.10, 0.0), "09:30:00").abrir(1L);
        assertEquals(6, r.getMonedas());
        assertEquals(2, r.getMultiplicador());
        verify(monedas).acreditar(1L, 6, "COFRE", HOY.toString());
    }

    @Test
    void yaAbiertoHoyNoPagaNada() {
        usuario(HOY, 95);
        CofreDTO r = servicio(azar(0, 0.10, 0.0), "15:00:00").abrir(1L);

        assertTrue(r.isYaAbierto());
        assertNull(r.getTipo());
        assertEquals(0, r.getMonedas());
        assertEquals(0, r.getXp());
        assertNull(r.getArticulo());
        assertEquals(40, r.getSaldoMonedas());
        verify(usuarios, never()).registrarCofre(anyLong(), any());
        verify(monedas, never()).acreditar(anyLong(), anyInt(), anyString(), anyString());
    }

    @Test
    void carreraParalelaPierdeElUpdateYNoPaga() {
        usuario(HOY.minusDays(1), 95);
        when(usuarios.registrarCofre(1L, HOY)).thenReturn(0);
        CofreDTO r = servicio(azar(0, 0.10, 0.0), "15:00:00").abrir(1L);

        assertTrue(r.isYaAbierto());
        verify(monedas, never()).acreditar(anyLong(), anyInt(), anyString(), anyString());
        verify(inventario, never()).save(any());
    }

    @Test
    void premioDeArticuloLoAgregaAlInventarioSinRepetir() {
        usuario(null, 0);
        ArticuloTienda tiene = ArticuloTienda.builder().id(1L).codigo("A").nombre("A")
                .categoria(CategoriaArticulo.PIN).rareza(RarezaArticulo.COMUN).precio(40).build();
        ArticuloTienda nuevo = ArticuloTienda.builder().id(2L).codigo("B").nombre("B")
                .categoria(CategoriaArticulo.PIN).rareza(RarezaArticulo.RARO).precio(120).imagen("/icons/b.png").build();
        when(inventario.findByUsuarioId(1L)).thenReturn(List.of(InventarioUsuario.builder().usuarioId(1L).articulo(tiene).build()));
        when(articulos.findByActivoTrueAndRarezaInAndPrecioGreaterThan(anyCollection(), anyInt()))
                .thenReturn(List.of(tiene, nuevo));

        CofreDTO r = servicio(azar(0, 0.01, 0.5), "15:00:00").abrir(1L);

        assertEquals("ARTICULO", r.getTipo());
        assertNotNull(r.getArticulo());
        assertEquals(2L, r.getArticulo().getId());
        assertTrue(r.getArticulo().isComprado());
        assertEquals(0, r.getMonedas());
        verify(inventario).save(any(InventarioUsuario.class));
        verify(monedas, never()).acreditar(anyLong(), anyInt(), anyString(), anyString());
    }

    @Test
    void sinArticulosDisponiblesSeCompensaConMonedas() {
        usuario(null, 0);
        ArticuloTienda tiene = ArticuloTienda.builder().id(1L).codigo("A").nombre("A")
                .categoria(CategoriaArticulo.PIN).rareza(RarezaArticulo.COMUN).precio(40).build();
        when(inventario.findByUsuarioId(1L)).thenReturn(List.of(InventarioUsuario.builder().usuarioId(1L).articulo(tiene).build()));
        when(articulos.findByActivoTrueAndRarezaInAndPrecioGreaterThan(anyCollection(), anyInt())).thenReturn(List.of(tiene));

        CofreDTO r = servicio(azar(0, 0.01, 0.0), "15:00:00").abrir(1L);

        assertEquals("MONEDAS", r.getTipo());
        assertEquals(3, r.getMonedas());
        assertNull(r.getArticulo());
        verify(inventario, never()).save(any());
        verify(monedas).acreditar(1L, 3, "COFRE", HOY.toString());
    }
}
