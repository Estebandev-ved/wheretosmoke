package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.SliceImpl;
import org.springframework.http.HttpStatus;

import com.medallo_map.wheretosmoke.dto.SocialDTO.ActividadAmigo;
import com.medallo_map.wheretosmoke.dto.SocialDTO.PaginaPersonas;
import com.medallo_map.wheretosmoke.dto.SocialDTO.PersonaSugerida;
import com.medallo_map.wheretosmoke.dto.SocialDTO.Privacidad;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Amistad;
import com.medallo_map.wheretosmoke.model.CirculoConfianza;
import com.medallo_map.wheretosmoke.model.EstadoAmistad;
import com.medallo_map.wheretosmoke.model.SelloComuna;
import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.AmistadRepository;
import com.medallo_map.wheretosmoke.repository.BloqueoRepository;
import com.medallo_map.wheretosmoke.repository.CirculoConfianzaRepository;
import com.medallo_map.wheretosmoke.repository.InventarioUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.MensajePrivadoRepository;
import com.medallo_map.wheretosmoke.repository.PersonasRepository;
import com.medallo_map.wheretosmoke.repository.SpotRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.service.ActividadAmigosService;
import com.medallo_map.wheretosmoke.service.AmistadService;
import com.medallo_map.wheretosmoke.service.PersonasService;
import com.medallo_map.wheretosmoke.service.UsuarioResumenService;

/** Reglas clave de sugerencias de personas: puntaje, razones, exclusiones, privacidad, paginación y actividad. */
class PersonasServiceTest {

    private static final Clock RELOJ = Clock.fixed(Instant.parse("2026-11-08T15:00:00Z"), ZoneId.of("America/Bogota"));
    private static final Long YO = 1L;
    private static final Long AMIGO = 5L;

    private UsuarioRepository usuarios;
    private AmistadRepository amistades;
    private BloqueoRepository bloqueos;
    private CirculoConfianzaRepository circulos;
    private PersonasRepository personas;
    private SpotRepository spots;
    private PersonasService service;
    private ActividadAmigosService actividad;
    private AmistadService amistadService;
    private final Map<Long, Usuario> mapa = new HashMap<>();

    @BeforeEach
    void setUp() {
        usuarios = mock(UsuarioRepository.class);
        amistades = mock(AmistadRepository.class);
        bloqueos = mock(BloqueoRepository.class);
        circulos = mock(CirculoConfianzaRepository.class);
        personas = mock(PersonasRepository.class);
        spots = mock(SpotRepository.class);
        InventarioUsuarioRepository inventario = mock(InventarioUsuarioRepository.class);
        UsuarioResumenService resumen = new UsuarioResumenService(usuarios, inventario);
        service = new PersonasService(usuarios, amistades, bloqueos, circulos, personas, resumen, RELOJ);
        actividad = new ActividadAmigosService(amistades, personas, spots, resumen);
        amistadService = new AmistadService(amistades, bloqueos, usuarios, mock(MensajePrivadoRepository.class),
                resumen, RELOJ);

        for (long id = 1; id <= 30; id++) {
            mapa.put(id, usuario(id));
        }
        when(usuarios.findById(anyLong())).thenAnswer(i -> Optional.ofNullable(mapa.get(i.<Long>getArgument(0))));
        when(usuarios.findAllById(anyCollection())).thenAnswer(i -> {
            List<Usuario> out = new ArrayList<>();
            for (Object id : (Iterable<?>) i.getArgument(0)) {
                if (mapa.containsKey(id)) {
                    out.add(mapa.get(id));
                }
            }
            return out;
        });
        when(amistades.findAmigos(YO, EstadoAmistad.ACEPTADA))
                .thenReturn(List.of(fila(YO, AMIGO, EstadoAmistad.ACEPTADA)));
        vacio();
    }

    private void vacio() {
        when(usuarios.personasActivas(anyLong(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of()));
        when(usuarios.personasNuevas(anyLong(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of()));
    }

    private static Usuario usuario(long id) {
        return Usuario.builder().id(id).username("user" + id).email("u" + id + "@x.com").password("h")
                .role(Usuario.Role.USER).puntos(120).createdAt(LocalDateTime.of(2026, 1, 5, 10, 0)).build();
    }

    private static Amistad fila(long a, long b, EstadoAmistad estado) {
        return Amistad.builder().id(9L).usuarioMenor(Math.min(a, b)).usuarioMayor(Math.max(a, b)).solicitanteId(a)
                .estado(estado).fechaSolicitud(LocalDateTime.of(2026, 11, 1, 9, 0)).build();
    }

    private static List<Object[]> filas(Object[]... f) {
        return new ArrayList<>(java.util.Arrays.asList(f));
    }

    private static Object[] par(long a, long b) {
        return new Object[] { a, b };
    }

    // ── Puntaje, razones y exclusiones ───────────────────────────────────────

    @Test
    void puntajeYRazonesOrdenanPorSenalYDesempatanPorId() {
        CirculoConfianza c = new CirculoConfianza();
        c.setId(100L);
        c.setNombre("Pandilla");
        when(circulos.findCirculosByUsuario(YO)).thenReturn(List.of(c));
        when(personas.amigosEnComunDeTodos(anyCollection())).thenReturn(filas(par(10, 3)));
        when(personas.miembrosDeCirculos(anyCollection(), eq(YO))).thenReturn(filas(par(11, 100)));
        when(personas.comunasRecientes(eq(YO), any())).thenReturn(List.of("El Poblado"));
        when(personas.usuariosEnComunas(eq(YO), anyCollection(), any()))
                .thenReturn(List.<Object[]>of(new Object[] { 12L, "El Poblado" }));
        when(usuarios.personasActivas(anyLong(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of(mapa.get(21L), mapa.get(20L))));

        PaginaPersonas r = service.sugeridas(YO, 0, 20);

        List<Long> ids = r.items().stream().map(PersonaSugerida::id).toList();
        assertEquals(List.of(10L, 11L, 12L, 20L, 21L), ids);
        PersonaSugerida primero = r.items().get(0);
        assertEquals(3, primero.amigosEnComun());
        assertEquals(32, primero.puntaje()); // 3 amigos * 10 + nivel parecido
        assertEquals(List.of("3 amigos en común", "Nivel parecido"), primero.razones());
        assertEquals(List.of("Está en tu círculo Pandilla", "Nivel parecido"), r.items().get(1).razones());
        assertEquals(List.of("Activo en El Poblado como tú", "Nivel parecido"), r.items().get(2).razones());
        assertEquals(2, r.items().get(3).puntaje()); // relleno sin señales: solo nivel
        assertFalse(r.hayMas());
    }

    @Test
    void excluyeBloqueadosAmigosInactivosYNoVisibles() {
        mapa.get(14L).setVisibleEnSugerencias(false);
        mapa.get(15L).setActivo(false);
        when(bloqueos.idsBloqueadosPor(YO)).thenReturn(List.of(13L));
        when(bloqueos.idsQueMeBloquearon(YO)).thenReturn(List.of(16L));
        when(personas.amigosEnComunDeTodos(anyCollection())).thenReturn(filas(
                par(1, 2), par(5, 1), par(13, 2), par(14, 2), par(15, 2), par(16, 2), par(17, 1)));
        when(usuarios.personasActivas(anyLong(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of(mapa.get(13L), mapa.get(14L), mapa.get(18L))));

        List<Long> ids = service.sugeridas(YO, 0, 20).items().stream().map(PersonaSugerida::id).toList();

        assertEquals(List.of(17L, 18L), ids.stream().sorted().toList().subList(0, 2));
        for (long excluido : new long[] { 1, 5, 13, 14, 15, 16 }) {
            assertFalse(ids.contains(excluido), "no debe sugerir a " + excluido);
        }
    }

    @Test
    void usuariosAntiguosConColumnasNulasSeTratanComoVisibles() {
        mapa.get(14L).setVisibleEnSugerencias(null);
        mapa.get(14L).setAceptaSolicitudes(null);
        when(personas.amigosEnComunDeTodos(anyCollection())).thenReturn(filas(par(14, 1)));
        assertTrue(service.sugeridas(YO, 0, 20).items().stream().anyMatch(p -> p.id() == 14L));
        assertEquals(new Privacidad(true, "TODOS"), service.privacidad(14L));
    }

    @Test
    void paginaYLimiteSeAcotanYMarcanHayMas() {
        List<Object[]> filas = new ArrayList<>();
        for (long id = 10; id <= 29; id++) {
            filas.add(par(id, 1));
        }
        when(personas.amigosEnComunDeTodos(anyCollection())).thenReturn(filas);

        PaginaPersonas p0 = service.sugeridas(YO, 0, 8);
        assertEquals(8, p0.items().size());
        assertTrue(p0.hayMas());
        assertEquals(10L, p0.items().get(0).id()); // empate de puntaje: id ascendente
        PaginaPersonas p2 = service.sugeridas(YO, 2, 8);
        assertEquals(4, p2.items().size());
        assertFalse(p2.hayMas());
        assertEquals(26L, p2.items().get(0).id());
        assertTrue(service.sugeridas(YO, 50, 8).items().isEmpty());
        assertEquals(20, service.sugeridas(YO, 0, 999).items().size()); // 20 candidatos < tope 30
        assertEquals(1, service.sugeridas(YO, 0, 0).items().size()); // mínimo 1
    }

    @Test
    void solicitudPendienteSeIncluyeConSuEstado() {
        when(personas.amigosEnComunDeTodos(anyCollection())).thenReturn(filas(par(10, 1)));
        when(amistades.findRelacionesCon(eq(YO), anyCollection())).thenReturn(List.of(fila(YO, 10, EstadoAmistad.PENDIENTE)));
        assertEquals("ENVIADA", service.sugeridas(YO, 0, 5).items().get(0).estadoAmistad());
    }

    // ── Descubrir ────────────────────────────────────────────────────────────

    @Test
    void descubrirValidaTextoYOrdenYEscapaLike() {
        esperar(HttpStatus.BAD_REQUEST, () -> service.descubrir(YO, "a", null, null, 0, 20));
        esperar(HttpStatus.BAD_REQUEST, () -> service.descubrir(YO, null, null, "popular", 0, 20));
        when(usuarios.personasNuevas(anyLong(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of(mapa.get(20L)), org.springframework.data.domain.PageRequest.of(0, 1), true));

        PaginaPersonas r = service.descubrir(YO, " 50%_x! ", " Laureles ", "nuevos", -3, 100);

        assertTrue(r.hayMas());
        assertEquals(1, r.items().size());
        ArgumentCaptor<String> patron = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Pageable> pag = ArgumentCaptor.forClass(Pageable.class);
        verify(usuarios).personasNuevas(eq(YO), patron.capture(), eq("Laureles"), pag.capture());
        assertEquals("%50!%!_x!!%", patron.getValue());
        assertEquals(0, pag.getValue().getPageNumber());
        assertEquals(30, pag.getValue().getPageSize());
    }

    @Test
    void descubrirSinFiltrosUsaPatronAbiertoYAmigosEnComun() {
        when(usuarios.personasActivas(anyLong(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of(mapa.get(20L))));
        when(personas.amigosEnComunCon(anyCollection(), anyCollection())).thenReturn(List.<Object[]>of(par(20, 2)));

        PersonaSugerida p = service.descubrir(YO, null, null, null, null, null).items().get(0);

        verify(usuarios).personasActivas(eq(YO), eq("%"), eq(""), any(Pageable.class));
        assertEquals(2, p.amigosEnComun());
        assertEquals(List.of("2 amigos en común"), p.razones());
    }

    // ── Privacidad ───────────────────────────────────────────────────────────

    @Test
    void privacidadValidaModoYConservaCamposNulos() {
        esperar(HttpStatus.BAD_REQUEST, () -> service.actualizarPrivacidad(YO, new Privacidad(true, "CUALQUIERA")));

        Privacidad r = service.actualizarPrivacidad(YO, new Privacidad(false, null));
        assertEquals(new Privacidad(false, "TODOS"), r);
        verify(usuarios).actualizarPrivacidad(YO, false, "TODOS");

        assertEquals("NADIE", service.actualizarPrivacidad(YO, new Privacidad(null, "nadie")).aceptaSolicitudes());
        verify(usuarios).actualizarPrivacidad(YO, true, "NADIE");
    }

    @Test
    void solicitudRespetaAceptaSolicitudes() {
        mapa.get(2L).setAceptaSolicitudes("NADIE");
        mapa.get(3L).setAceptaSolicitudes("AMIGOS_DE_AMIGOS");
        mapa.get(4L).setAceptaSolicitudes("AMIGOS_DE_AMIGOS");
        when(amistades.findByUsuarioMenorAndUsuarioMayor(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(amistades.saveAndFlush(any(Amistad.class))).thenAnswer(i -> i.getArgument(0));

        esperar(HttpStatus.FORBIDDEN, () -> amistadService.enviarSolicitud(YO, 2L));
        esperar(HttpStatus.FORBIDDEN, () -> amistadService.enviarSolicitud(YO, 3L)); // sin amigos en común

        when(amistades.findRelacionesCon(eq(4L), anyCollection())).thenReturn(List.of(fila(4, AMIGO, EstadoAmistad.ACEPTADA)));
        assertEquals("ENVIADA", amistadService.enviarSolicitud(YO, 4L).estado());
    }

    // ── Amigos en común ──────────────────────────────────────────────────────

    @Test
    void amigosEnComunNoExisteSiHayBloqueo() {
        when(bloqueos.existeEntre(YO, 2L)).thenReturn(true);
        esperar(HttpStatus.NOT_FOUND, () -> service.amigosEnComun(YO, 2L));
        assertTrue(service.amigosEnComun(YO, YO).isEmpty());
    }

    @Test
    void amigosEnComunDevuelveSoloAceptadosYSinDatosSensibles() {
        when(amistades.findRelacionesCon(eq(2L), anyCollection())).thenReturn(List.of(
                fila(2, AMIGO, EstadoAmistad.ACEPTADA), fila(2, 6, EstadoAmistad.PENDIENTE)));
        var r = service.amigosEnComun(YO, 2L);
        assertEquals(1, r.size());
        assertEquals(AMIGO, r.get(0).id());
        assertEquals(4, r.get(0).getClass().getRecordComponents().length); // id, username, nivel, equipados
    }

    // ── Actividad ────────────────────────────────────────────────────────────

    @Test
    void actividadSinAmigosEstaVacia() {
        when(amistades.findAmigos(YO, EstadoAmistad.ACEPTADA)).thenReturn(List.of());
        assertTrue(actividad.actividad(YO, 20).isEmpty());
        verify(personas, never()).spotsCreados(anyCollection(), anyInt());
    }

    @Test
    void actividadMezclaFuentesOrdenaPorFechaYRespetaLimite() {
        SelloComuna sello = SelloComuna.builder().usuarioId(AMIGO).comuna("Laureles")
                .fecha(LocalDateTime.of(2026, 11, 7, 12, 0)).build();
        when(personas.spotsCreados(anyCollection(), anyInt())).thenReturn(List.<Object[]>of(
                new Object[] { 40L, "Parque X", AMIGO, java.sql.Timestamp.valueOf(LocalDateTime.of(2026, 11, 8, 9, 0)) }));
        when(personas.sellosRecientes(anyCollection(), any(Pageable.class))).thenReturn(List.of(sello));
        when(personas.fotosRecientes(anyCollection(), any(Pageable.class))).thenReturn(List.<Object[]>of(
                new Object[] { 7L, AMIGO, 40L, LocalDateTime.of(2026, 11, 6, 8, 0) }));
        Spot s = new Spot();
        s.setId(40L);
        s.setNombre("Parque X");
        when(spots.findAllById(anyCollection())).thenReturn(List.of(s));

        List<ActividadAmigo> todo = actividad.actividad(YO, 20);

        assertEquals(List.of("SPOT_DESCUBIERTO", "SELLO_COMUNA", "FOTO"), todo.stream().map(ActividadAmigo::tipo).toList());
        assertEquals("descubrió Parque X", todo.get(0).texto());
        assertEquals("completó la comuna Laureles", todo.get(1).texto());
        assertEquals(40L, todo.get(2).spotId());
        assertEquals(AMIGO, todo.get(0).usuario().id());
        assertEquals(2, actividad.actividad(YO, 2).size());
        assertEquals(1, actividad.actividad(YO, -5).size()); // límite mínimo 1
        assertEquals(5, ActividadAmigo.class.getRecordComponents().length);
    }

    private static void esperar(HttpStatus status, Runnable accion) {
        NegocioException e = assertThrows(NegocioException.class, accion::run);
        assertEquals(status, e.getStatus());
    }
}
