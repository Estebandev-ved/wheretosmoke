package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;

import com.medallo_map.wheretosmoke.dto.TiendaEstadoDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.ArticuloTienda;
import com.medallo_map.wheretosmoke.model.CategoriaArticulo;
import com.medallo_map.wheretosmoke.model.InventarioUsuario;
import com.medallo_map.wheretosmoke.model.RarezaArticulo;
import com.medallo_map.wheretosmoke.model.TransaccionMonedas;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.ArticuloTiendaRepository;
import com.medallo_map.wheretosmoke.repository.InventarioUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.TransaccionMonedasRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.service.MonedasService;
import com.medallo_map.wheretosmoke.service.TiendaService;

/** Billetera simulada en memoria: reproduce la semántica atómica de los UPDATE de UsuarioRepository. */
class TiendaServiceTest {

    private final AtomicInteger saldo = new AtomicInteger(200);
    private UsuarioRepository usuarios;
    private ArticuloTiendaRepository articulos;
    private InventarioUsuarioRepository inventario;
    private TransaccionMonedasRepository transacciones;
    private TiendaService tienda;
    private final List<InventarioUsuario> guardados = new ArrayList<>();

    @BeforeEach
    void setUp() {
        usuarios = mock(UsuarioRepository.class);
        articulos = mock(ArticuloTiendaRepository.class);
        inventario = mock(InventarioUsuarioRepository.class);
        transacciones = mock(TransaccionMonedasRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-11-07T15:00:00Z"), ZoneId.of("America/Bogota"));

        Usuario usuario = Usuario.builder().id(1L).puntos(1000).build(); // nivel 5
        when(usuarios.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarios.findByIdForUpdate(1L)).thenReturn(Optional.of(usuario));
        when(usuarios.obtenerMonedas(1L)).thenAnswer(i -> saldo.get());
        when(usuarios.restarMonedasSiAlcanza(anyLong(), anyInt())).thenAnswer(i -> {
            int monto = i.getArgument(1);
            if (saldo.get() >= monto) { // condición dentro del "UPDATE"
                saldo.addAndGet(-monto);
                return 1;
            }
            return 0;
        });
        when(usuarios.sumarMonedas(anyLong(), anyInt())).thenAnswer(i -> {
            saldo.addAndGet(i.<Integer>getArgument(1));
            return 1;
        });
        when(inventario.saveAndFlush(any())).thenAnswer(i -> {
            guardados.add(i.getArgument(0));
            return i.getArgument(0);
        });
        when(inventario.findByUsuarioId(1L)).thenAnswer(i -> guardados);

        MonedasService monedas = new MonedasService(usuarios, transacciones, clock);
        tienda = new TiendaService(articulos, inventario, usuarios, monedas, clock);
    }

    private ArticuloTienda articulo(long id, int precio, int nivel, CategoriaArticulo cat) {
        ArticuloTienda a = ArticuloTienda.builder().id(id).codigo("A" + id).nombre("Art " + id)
                .categoria(cat).rareza(RarezaArticulo.RARO).precio(precio).nivelRequerido(nivel).activo(true).build();
        when(articulos.findById(id)).thenReturn(Optional.of(a));
        return a;
    }

    @Test
    void compraExitosaDescuentaYAudita() {
        articulo(1, 150, 2, CategoriaArticulo.SKIN);
        TiendaEstadoDTO estado = tienda.comprar(1L, 1L);

        assertEquals(50, estado.getMonedas());
        assertEquals(1, estado.getInventario().size());
        ArgumentCaptor<TransaccionMonedas> captor = ArgumentCaptor.forClass(TransaccionMonedas.class);
        verify(transacciones).save(captor.capture());
        assertEquals(-150, captor.getValue().getDelta());
        assertEquals(50, captor.getValue().getSaldoResultante());
        assertEquals("COMPRA", captor.getValue().getMotivo());
    }

    @Test
    void saldoInsuficienteNoCompraNiCobra() {
        articulo(1, 500, 1, CategoriaArticulo.SKIN);
        NegocioException e = assertThrows(NegocioException.class, () -> tienda.comprar(1L, 1L));
        assertEquals(HttpStatus.PAYMENT_REQUIRED, e.getStatus());
        assertEquals(200, saldo.get());
        verify(inventario, never()).saveAndFlush(any());
    }

    @Test
    void nivelInsuficienteBloquea() {
        articulo(1, 50, 10, CategoriaArticulo.MASCOTA);
        NegocioException e = assertThrows(NegocioException.class, () -> tienda.comprar(1L, 1L));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
        assertEquals(200, saldo.get());
        verify(inventario, never()).saveAndFlush(any());
    }

    @Test
    void compraDuplicadaSeRechazaSinCobrar() {
        articulo(1, 50, 1, CategoriaArticulo.PIN);
        when(inventario.existsByUsuarioIdAndArticuloId(1L, 1L)).thenReturn(true);
        NegocioException e = assertThrows(NegocioException.class, () -> tienda.comprar(1L, 1L));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
        assertEquals(200, saldo.get());
    }

    @Test
    void cobroAtomicoRechazaSiOtraPeticionGastoElSaldoEntreTanto() {
        articulo(1, 150, 1, CategoriaArticulo.SKIN);
        // La verificación previa ve 200, pero cuando llega el UPDATE atómico el saldo real ya es 20
        when(usuarios.obtenerMonedas(1L)).thenReturn(200);
        saldo.set(20);
        NegocioException e = assertThrows(NegocioException.class, () -> tienda.comprar(1L, 1L));
        assertEquals(HttpStatus.PAYMENT_REQUIRED, e.getStatus());
        assertEquals(20, saldo.get());
        verify(transacciones, never()).save(any());
    }

    @Test
    void ningunaSecuenciaDeComprasDejaSaldoNegativo() {
        articulo(1, 150, 1, CategoriaArticulo.SKIN);
        articulo(2, 150, 1, CategoriaArticulo.PIN);
        articulo(3, 40, 1, CategoriaArticulo.MARCO);
        for (long id : new long[] { 1, 2, 3, 1, 2, 3 }) {
            try {
                tienda.comprar(1L, id);
            } catch (NegocioException esperada) {
                // no alcanza el saldo o ya se tiene
            }
            assertTrue(saldo.get() >= 0, "saldo negativo tras comprar " + id);
        }
        assertEquals(10, saldo.get()); // 200 - 150 - 40
    }

    @Test
    void montosInvalidosSeRechazan() {
        MonedasService m = new MonedasService(usuarios, transacciones, Clock.systemUTC());
        assertThrows(IllegalArgumentException.class, () -> m.debitar(1L, -5, "X", "x"));
        assertThrows(IllegalArgumentException.class, () -> m.acreditar(1L, 0, "X", "x"));
        assertEquals(200, saldo.get());
    }

    @Test
    void equiparDejaSoloUnoPorCategoria() {
        ArticuloTienda a = articulo(1, 10, 1, CategoriaArticulo.SKIN);
        ArticuloTienda b = articulo(2, 10, 1, CategoriaArticulo.SKIN);
        InventarioUsuario ia = InventarioUsuario.builder().id(1L).usuarioId(1L).articulo(a).equipado(true).build();
        InventarioUsuario ib = InventarioUsuario.builder().id(2L).usuarioId(1L).articulo(b).equipado(false).build();
        guardados.add(ia);
        guardados.add(ib);
        when(inventario.findByUsuarioIdAndArticuloId(1L, 2L)).thenReturn(Optional.of(ib));
        when(inventario.findByUsuarioIdAndArticuloCategoria(1L, CategoriaArticulo.SKIN)).thenReturn(List.of(ia, ib));

        TiendaEstadoDTO estado = tienda.equipar(1L, 2L);
        assertFalse(ia.isEquipado());
        assertTrue(ib.isEquipado());
        assertEquals("A2", estado.getEquipados().get("SKIN").getCodigo());

        // equipar algo que no se tiene
        when(inventario.findByUsuarioIdAndArticuloId(1L, 9L)).thenReturn(Optional.empty());
        assertThrows(NegocioException.class, () -> tienda.equipar(1L, 9L));

        estado = tienda.desequipar(1L, 2L);
        assertFalse(ib.isEquipado());
        assertTrue(estado.getEquipados().isEmpty());
    }
}
