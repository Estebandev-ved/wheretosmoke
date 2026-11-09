package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.medallo_map.wheretosmoke.dto.AlbumComunaDTO;
import com.medallo_map.wheretosmoke.dto.ComunaRankingDTO;
import com.medallo_map.wheretosmoke.dto.FotoDTO;
import com.medallo_map.wheretosmoke.dto.MetaCirculoDTO;
import com.medallo_map.wheretosmoke.dto.ReaccionFotoDTO;
import com.medallo_map.wheretosmoke.dto.ReclamoMetaDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.CirculoConfianza;
import com.medallo_map.wheretosmoke.model.MiembroCirculo;
import com.medallo_map.wheretosmoke.model.ReaccionFoto;
import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.CirculoConfianzaRepository;
import com.medallo_map.wheretosmoke.repository.FotoRepository;
import com.medallo_map.wheretosmoke.repository.MiembroCirculoRepository;
import com.medallo_map.wheretosmoke.repository.ReaccionFotoRepository;
import com.medallo_map.wheretosmoke.repository.ReclamoMetaCirculoRepository;
import com.medallo_map.wheretosmoke.repository.SelloComunaRepository;
import com.medallo_map.wheretosmoke.repository.SpotRepository;
import com.medallo_map.wheretosmoke.repository.TransaccionMonedasRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.repository.VisitaSpotRepository;
import com.medallo_map.wheretosmoke.service.AlbumService;
import com.medallo_map.wheretosmoke.service.CirculoMetaService;
import com.medallo_map.wheretosmoke.service.DescubridorService;
import com.medallo_map.wheretosmoke.service.MonedasService;
import com.medallo_map.wheretosmoke.service.RankingComunaService;
import com.medallo_map.wheretosmoke.service.ReaccionFotoService;
import com.medallo_map.wheretosmoke.service.VisitaService;

/** Descubridor, visitas, álbum, ranking por comuna, meta de círculo y reacciones. */
class ServiciosSocialesTest {

    private static final LocalDate HOY = LocalDate.of(2026, 11, 7); // sábado
    private static final LocalDate LUNES = LocalDate.of(2026, 11, 2);
    private static final String EMOJI_FUEGO = "🔥";
    private static final String EMOJI_RISA = "😂";

    private Clock clock;
    private MonedasService monedas;
    private UsuarioRepository usuarios;
    private SpotRepository spots;
    private VisitaSpotRepository visitas;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-11-07T15:00:00Z"), ZoneId.of("America/Bogota"));
        monedas = mock(MonedasService.class);
        usuarios = mock(UsuarioRepository.class);
        spots = mock(SpotRepository.class);
        visitas = mock(VisitaSpotRepository.class);
    }

    // ── Descubridor ──────────────────────────────────────────────

    @Test
    void descubridorGanaBonoUnaVezPorSpot() {
        TransaccionMonedasRepository trans = mock(TransaccionMonedasRepository.class);
        when(trans.existsByUsuarioIdAndMotivoAndReferencia(1L, "DESCUBRIDOR", "spot:9")).thenReturn(false, true);
        DescubridorService service = new DescubridorService(monedas, usuarios, trans);

        assertTrue(service.premiar(1L, 9L));
        assertFalse(service.premiar(1L, 9L)); // reintento: ya estaba pagado

        verify(monedas, org.mockito.Mockito.times(1)).acreditar(1L, 30, "DESCUBRIDOR", "spot:9");
        verify(usuarios, org.mockito.Mockito.times(1)).sumarXp(1L, 40);
    }

    // ── Visitas ──────────────────────────────────────────────────

    private Spot spot(long id, String comuna) {
        Spot s = new Spot();
        s.setId(id);
        s.setComuna(comuna);
        return s;
    }

    @Test
    void visitaNuevaRevisaElAlbumDeLaComuna() {
        AlbumService album = mock(AlbumService.class);
        VisitaService service = new VisitaService(visitas, album, clock);
        when(visitas.registrarSiNoExiste(eq(1L), eq(5L), eq(HOY), any())).thenReturn(1);

        service.registrar(1L, spot(5L, "El Poblado"));
        verify(album).verificarComuna(1L, "El Poblado");
    }

    @Test
    void visitaRepetidaDelMismoDiaNoRevisaNada() {
        AlbumService album = mock(AlbumService.class);
        VisitaService service = new VisitaService(visitas, album, clock);
        when(visitas.registrarSiNoExiste(anyLong(), anyLong(), any(), any())).thenReturn(0);

        service.registrar(1L, spot(5L, "El Poblado"));
        verify(album, never()).verificarComuna(anyLong(), anyString());
    }

    @Test
    void visitaAnonimaOConErrorNoLanza() {
        AlbumService album = mock(AlbumService.class);
        VisitaService service = new VisitaService(visitas, album, clock);

        service.registrar(null, spot(5L, "El Poblado"));
        verify(visitas, never()).registrarSiNoExiste(anyLong(), anyLong(), any(), any());

        when(visitas.registrarSiNoExiste(anyLong(), anyLong(), any(), any())).thenThrow(new RuntimeException("BD caída"));
        service.registrar(1L, spot(5L, "El Poblado")); // no lanza
    }

    // ── Álbum ────────────────────────────────────────────────────

    private AlbumService album(SelloComunaRepository sellos) {
        return new AlbumService(spots, visitas, sellos, monedas, clock);
    }

    @Test
    void albumCompletarUnaComunaPagaElBonoUnaSolaVez() {
        SelloComunaRepository sellos = mock(SelloComunaRepository.class);
        when(spots.countByComuna("El Poblado")).thenReturn(3L);
        when(visitas.contarVisitadosEnComuna(1L, "El Poblado")).thenReturn(3L);
        when(sellos.otorgarSiNoExiste(eq(1L), eq("El Poblado"), any())).thenReturn(1, 0);
        AlbumService service = album(sellos);

        assertTrue(service.verificarComuna(1L, "El Poblado"));
        assertFalse(service.verificarComuna(1L, "El Poblado")); // el INSERT IGNORE ya no inserta

        verify(monedas, org.mockito.Mockito.times(1)).acreditar(1L, 50, "ALBUM_COMUNA", "El Poblado");
    }

    @Test
    void albumIncompletoNoOtorgaNada() {
        SelloComunaRepository sellos = mock(SelloComunaRepository.class);
        when(spots.countByComuna("Belén")).thenReturn(4L);
        when(visitas.contarVisitadosEnComuna(1L, "Belén")).thenReturn(3L);
        assertFalse(album(sellos).verificarComuna(1L, "Belén"));

        when(spots.countByComuna("Popular")).thenReturn(2L); // menos del mínimo de 3 spots
        when(visitas.contarVisitadosEnComuna(1L, "Popular")).thenReturn(2L);
        assertFalse(album(sellos).verificarComuna(1L, "Popular"));

        verify(sellos, never()).otorgarSiNoExiste(anyLong(), anyString(), any());
        verify(monedas, never()).acreditar(anyLong(), anyInt(), anyString(), anyString());
    }

    @Test
    void albumListaTodasLasComunasConAvance() {
        SelloComunaRepository sellos = mock(SelloComunaRepository.class);
        when(spots.contarPorComuna()).thenReturn(List.of(
                new Object[] { "El Poblado", 4L }, new Object[] { "Belén", 5L }));
        when(visitas.visitadosPorComuna(1L)).thenReturn(List.of(
                new Object[] { "El Poblado", 4L }, new Object[] { "Belén", 2L }));
        when(sellos.otorgarSiNoExiste(anyLong(), anyString(), any())).thenReturn(1);

        List<AlbumComunaDTO> album = album(sellos).obtenerAlbum(1L);

        assertEquals(21, album.size());
        AlbumComunaDTO poblado = album.stream().filter(a -> a.getComuna().equals("El Poblado")).findFirst().orElseThrow();
        assertTrue(poblado.isCompleta());
        assertEquals(4, poblado.getVisitados());
        assertEquals("SELLO_EL_POBLADO", poblado.getSello());
        AlbumComunaDTO belen = album.stream().filter(a -> a.getComuna().equals("Belén")).findFirst().orElseThrow();
        assertFalse(belen.isCompleta());
        assertEquals(5, belen.getTotalSpots());
        AlbumComunaDTO vacia = album.stream().filter(a -> a.getComuna().equals("Popular")).findFirst().orElseThrow();
        assertEquals(0, vacia.getTotalSpots());
        assertFalse(vacia.isCompleta());
        // El sello pendiente de El Poblado se otorga al consultar el álbum
        verify(sellos).otorgarSiNoExiste(eq(1L), eq("El Poblado"), any());
        verify(monedas).acreditar(1L, 50, "ALBUM_COMUNA", "El Poblado");
    }

    // ── Ranking por comuna ───────────────────────────────────────

    @Test
    void rankingSumaXpDeUsuariosDistintosYDaTop3() {
        when(visitas.usuariosActivosPorComuna(any())).thenReturn(List.of(
                new Object[] { "El Poblado", 1L, "ana", 500 },
                new Object[] { "El Poblado", 2L, "beto", 300 },
                new Object[] { "El Poblado", 3L, "caro", 100 },
                new Object[] { "El Poblado", 4L, "dani", 50 },
                new Object[] { "Belén", 1L, "ana", 500 },
                new Object[] { "Popular", 5L, "eva", 20 }));
        when(spots.contarPorComuna()).thenReturn(List.<Object[]>of(new Object[] { "El Poblado", 7L }));
        RankingComunaService service = new RankingComunaService(visitas, spots, clock);

        List<ComunaRankingDTO> ranking = service.obtenerRanking();

        assertEquals(21, ranking.size());
        ComunaRankingDTO primera = ranking.get(0);
        assertEquals("El Poblado", primera.getComuna());
        assertEquals(1, primera.getPosicion());
        assertEquals(950L, primera.getXpTotal());
        assertEquals(4, primera.getUsuariosActivos());
        assertEquals(7, primera.getTotalSpots());
        assertEquals(3, primera.getTop().size());
        assertEquals("ana", primera.getTop().get(0).getUsername());
        assertEquals("caro", primera.getTop().get(2).getUsername());
        assertEquals("Belén", ranking.get(1).getComuna());
        assertEquals(2, ranking.get(1).getPosicion());
        assertEquals(0L, ranking.get(ranking.size() - 1).getXpTotal());
        // Una sola consulta de actividad y una de totales para todo el ranking
        verify(visitas, org.mockito.Mockito.times(1)).usuariosActivosPorComuna(eq(HOY.minusDays(30)));
        verify(spots, org.mockito.Mockito.times(1)).contarPorComuna();
    }

    // ── Meta de círculo ──────────────────────────────────────────

    private CirculoConfianzaRepository circulos;
    private MiembroCirculoRepository miembros;
    private ReclamoMetaCirculoRepository reclamos;
    private CirculoMetaService meta;

    private void prepararMeta(boolean circuloActivo, Boolean miembroActivo, long numMiembros, long visitasSemana) {
        circulos = mock(CirculoConfianzaRepository.class);
        miembros = mock(MiembroCirculoRepository.class);
        reclamos = mock(ReclamoMetaCirculoRepository.class);
        CirculoConfianza c = new CirculoConfianza();
        c.setId(7L);
        c.setActivo(circuloActivo);
        when(circulos.findById(7L)).thenReturn(Optional.of(c));
        if (miembroActivo != null) {
            MiembroCirculo m = new MiembroCirculo();
            m.setActivo(miembroActivo);
            when(miembros.findByCirculoIdAndUsuarioId(7L, 1L)).thenReturn(Optional.of(m));
        } else {
            when(miembros.findByCirculoIdAndUsuarioId(7L, 1L)).thenReturn(Optional.empty());
        }
        when(miembros.contarMiembrosActivos(7L)).thenReturn(numMiembros);
        when(visitas.contarVisitasMiembros(7L, LUNES, LUNES.plusDays(6))).thenReturn(visitasSemana);
        when(usuarios.findById(1L)).thenReturn(Optional.of(Usuario.builder().id(1L).puntos(80).build()));
        when(usuarios.obtenerMonedas(1L)).thenReturn(10);
        when(monedas.acreditar(anyLong(), anyInt(), anyString(), anyString())).thenReturn(50);
        meta = new CirculoMetaService(circulos, miembros, visitas, reclamos, usuarios, monedas, clock);
    }

    @Test
    void metaObjetivoEsCincoPorMiembroConMinimoDiez() {
        prepararMeta(true, true, 4, 12);
        MetaCirculoDTO m = meta.obtener(7L, 1L);
        assertEquals(20, m.getObjetivo());
        assertEquals(12, m.getProgreso());
        assertFalse(m.isCompletada());
        assertFalse(m.isReclamosPendientes());
        assertTrue(m.getSegundosRestantes() > 0);

        prepararMeta(true, true, 2, 4);
        assertEquals(10, meta.obtener(7L, 1L).getObjetivo());
    }

    @Test
    void metaCompletadaTieneReclamoPendienteHastaQueSeReclama() {
        prepararMeta(true, true, 2, 10);
        when(reclamos.existsByCirculoIdAndUsuarioIdAndSemana(7L, 1L, LUNES)).thenReturn(false);
        MetaCirculoDTO m = meta.obtener(7L, 1L);
        assertTrue(m.isCompletada());
        assertTrue(m.isReclamosPendientes());

        when(reclamos.existsByCirculoIdAndUsuarioIdAndSemana(7L, 1L, LUNES)).thenReturn(true);
        m = meta.obtener(7L, 1L);
        assertTrue(m.isYaReclamado());
        assertFalse(m.isReclamosPendientes());
    }

    @Test
    void reclamarEsIdempotentePorSemana() {
        prepararMeta(true, true, 2, 11);
        when(reclamos.registrarSiNoExiste(eq(7L), eq(1L), eq(LUNES), any())).thenReturn(1, 0);

        ReclamoMetaDTO primero = meta.reclamar(7L, 1L);
        assertFalse(primero.isYaReclamado());
        assertEquals(40, primero.getMonedasGanadas());
        assertEquals(30, primero.getXpGanado());
        assertEquals(110, primero.getPuntos());
        assertTrue(primero.isSubioNivel()); // 80 + 30 cruza los 100 XP

        ReclamoMetaDTO segundo = meta.reclamar(7L, 1L);
        assertTrue(segundo.isYaReclamado());
        assertEquals(0, segundo.getMonedasGanadas());

        verify(monedas, org.mockito.Mockito.times(1)).acreditar(1L, 40, "META_CIRCULO", "7:" + LUNES);
        verify(usuarios, org.mockito.Mockito.times(1)).sumarXp(1L, 30);
    }

    @Test
    void reclamarSinMetaCompletaOSinSerMiembroFalla() {
        prepararMeta(true, true, 2, 9);
        NegocioException incompleta = assertThrows(NegocioException.class, () -> meta.reclamar(7L, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, incompleta.getStatus());

        prepararMeta(true, false, 2, 50); // se salió del círculo
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(NegocioException.class, () -> meta.reclamar(7L, 1L)).getStatus());
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(NegocioException.class, () -> meta.obtener(7L, 1L)).getStatus());

        prepararMeta(true, null, 2, 50); // nunca fue miembro
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(NegocioException.class, () -> meta.reclamar(7L, 1L)).getStatus());

        prepararMeta(false, true, 2, 50); // círculo eliminado
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(NegocioException.class, () -> meta.obtener(7L, 1L)).getStatus());

        verify(monedas, never()).acreditar(anyLong(), anyInt(), anyString(), anyString());
    }

    // ── Reacciones ───────────────────────────────────────────────

    private ReaccionFotoRepository reacciones;
    private ReaccionFotoService reaccionService;

    private void prepararReacciones() {
        reacciones = mock(ReaccionFotoRepository.class);
        FotoRepository fotos = mock(FotoRepository.class);
        when(fotos.existsById(3L)).thenReturn(true);
        when(fotos.existsById(99L)).thenReturn(false);
        when(reacciones.contarPorFoto(anyCollection())).thenReturn(List.<Object[]>of(
                new Object[] { 3L, "FUEGO", 2L }, new Object[] { 3L, "HOJA", 1L }));
        reaccionService = new ReaccionFotoService(reacciones, fotos);
    }

    @Test
    void primeraReaccionSeGuardaYDevuelveConteos() {
        prepararReacciones();
        when(reacciones.findByFotoIdAndUsuarioId(3L, 1L)).thenReturn(Optional.empty());
        when(reacciones.findByUsuarioIdAndFotoIdIn(eq(1L), anyCollection()))
                .thenReturn(List.of(ReaccionFoto.builder().fotoId(3L).usuarioId(1L).codigo("FUEGO").build()));

        ReaccionFotoDTO r = reaccionService.reaccionar(3L, 1L, EMOJI_FUEGO);

        verify(reacciones).save(any(ReaccionFoto.class));
        assertEquals(EMOJI_FUEGO, r.getMiReaccion());
        assertEquals(2, r.getReacciones().get(EMOJI_FUEGO));
        assertEquals(1, r.getReacciones().get("🌿"));
        assertEquals(0, r.getReacciones().get(EMOJI_RISA));
        assertEquals(5, r.getReacciones().size()); // siempre los 5 permitidos
    }

    @Test
    void otroEmojiReemplazaYElMismoQuita() {
        prepararReacciones();
        ReaccionFoto existente = ReaccionFoto.builder().id(10L).fotoId(3L).usuarioId(1L).codigo("FUEGO").build();
        when(reacciones.findByFotoIdAndUsuarioId(3L, 1L)).thenReturn(Optional.of(existente));
        when(reacciones.findByUsuarioIdAndFotoIdIn(eq(1L), anyCollection())).thenReturn(List.of());

        // Cambiar: reemplaza en la misma fila (no crea otra)
        reaccionService.reaccionar(3L, 1L, EMOJI_RISA);
        assertEquals("RISA", existente.getCodigo());
        verify(reacciones).save(existente);
        verify(reacciones, never()).delete(any());

        // Repetir el mismo: quita
        reaccionService.reaccionar(3L, 1L, EMOJI_RISA);
        verify(reacciones).delete(existente);
        ReaccionFotoDTO r = reaccionService.reaccionar(3L, 1L, EMOJI_RISA);
        assertNull(r.getMiReaccion());
    }

    @Test
    void emojiInvalidoOFotoInexistenteSeRechazan() {
        prepararReacciones();
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(NegocioException.class, () -> reaccionService.reaccionar(3L, 1L, "💩")).getStatus());
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(NegocioException.class, () -> reaccionService.reaccionar(3L, 1L, null)).getStatus());
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(NegocioException.class, () -> reaccionService.reaccionar(3L, 1L, "hola")).getStatus());
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(NegocioException.class, () -> reaccionService.reaccionar(99L, 1L, EMOJI_FUEGO)).getStatus());
        verify(reacciones, never()).save(any());
    }

    @Test
    void anexarEnLoteUsaDosConsultasYFuncionaSinUsuario() {
        prepararReacciones();
        List<FotoDTO> fotos = new ArrayList<>(List.of(FotoDTO.builder().id(3L).build(), FotoDTO.builder().id(4L).build()));

        reaccionService.anexar(fotos, null);

        assertEquals(2, fotos.get(0).getReacciones().get(EMOJI_FUEGO));
        assertEquals(0, fotos.get(1).getReacciones().get(EMOJI_FUEGO));
        assertNull(fotos.get(0).getMiReaccion());
        verify(reacciones, never()).findByUsuarioIdAndFotoIdIn(any(), anyCollection());
    }
}
