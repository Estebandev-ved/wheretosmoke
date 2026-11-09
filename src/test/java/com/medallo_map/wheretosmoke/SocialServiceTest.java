package com.medallo_map.wheretosmoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.RecordComponent;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.medallo_map.wheretosmoke.dto.SocialDTO;
import com.medallo_map.wheretosmoke.dto.SocialDTO.MensajeDTO;
import com.medallo_map.wheretosmoke.dto.SocialDTO.PaginaMensajes;
import com.medallo_map.wheretosmoke.dto.SocialDTO.PerfilPublico;
import com.medallo_map.wheretosmoke.dto.SocialDTO.SolicitudResultado;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Amistad;
import com.medallo_map.wheretosmoke.model.EstadoAmistad;
import com.medallo_map.wheretosmoke.model.MensajePrivado;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.AmistadRepository;
import com.medallo_map.wheretosmoke.repository.BloqueoRepository;
import com.medallo_map.wheretosmoke.repository.InventarioUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.MensajePrivadoRepository;
import com.medallo_map.wheretosmoke.repository.SelloComunaRepository;
import com.medallo_map.wheretosmoke.repository.SpotRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.security.MensajeRateLimiter;
import com.medallo_map.wheretosmoke.service.AmistadService;
import com.medallo_map.wheretosmoke.service.BloqueoService;
import com.medallo_map.wheretosmoke.service.MensajePrivadoService;
import com.medallo_map.wheretosmoke.service.PerfilPublicoService;
import com.medallo_map.wheretosmoke.service.UsuarioResumenService;

/** Reglas clave de amistades, bloqueos, mensajes privados, límite de envío y privacidad del perfil. */
class SocialServiceTest {

    private static final Clock RELOJ = Clock.fixed(Instant.parse("2026-11-08T15:00:00Z"), ZoneId.of("America/Bogota"));
    private static final Long YO = 1L;
    private static final Long ANA = 2L;
    private static final Long LUIS = 3L;

    private AmistadRepository amistades;
    private BloqueoRepository bloqueos;
    private UsuarioRepository usuarios;
    private MensajePrivadoRepository mensajes;
    private InventarioUsuarioRepository inventario;
    private SpotRepository spots;
    private SelloComunaRepository sellos;
    private SimpMessagingTemplate ws;
    private UsuarioResumenService resumen;
    private AmistadService amistadService;
    private BloqueoService bloqueoService;
    private PerfilPublicoService perfilService;

    @BeforeEach
    void setUp() {
        amistades = mock(AmistadRepository.class);
        bloqueos = mock(BloqueoRepository.class);
        usuarios = mock(UsuarioRepository.class);
        mensajes = mock(MensajePrivadoRepository.class);
        inventario = mock(InventarioUsuarioRepository.class);
        spots = mock(SpotRepository.class);
        sellos = mock(SelloComunaRepository.class);
        ws = mock(SimpMessagingTemplate.class);
        resumen = new UsuarioResumenService(usuarios, inventario);
        amistadService = new AmistadService(amistades, bloqueos, usuarios, mensajes, resumen, RELOJ);
        bloqueoService = new BloqueoService(bloqueos, amistades, usuarios, resumen, RELOJ);
        perfilService = new PerfilPublicoService(usuarios, amistades, bloqueos, spots, sellos, resumen,
                mock(com.medallo_map.wheretosmoke.repository.PersonasRepository.class), RELOJ);

        for (long id : new long[] { YO, ANA, LUIS }) {
            when(usuarios.findById(id)).thenReturn(Optional.of(usuario(id)));
            when(usuarios.existsById(id)).thenReturn(true);
        }
        when(usuarios.findAllById(anyCollection())).thenAnswer(i -> {
            List<Usuario> out = new ArrayList<>();
            for (Object id : (Iterable<?>) i.getArgument(0)) {
                out.add(usuario((Long) id));
            }
            return out;
        });
        when(amistades.findByUsuarioMenorAndUsuarioMayor(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(amistades.saveAndFlush(any(Amistad.class))).thenAnswer(i -> {
            Amistad a = i.getArgument(0);
            a.setId(77L);
            return a;
        });
        when(amistades.save(any(Amistad.class))).thenAnswer(i -> i.getArgument(0));
    }

    private static Usuario usuario(long id) {
        return Usuario.builder().id(id).username("user" + id).email("user" + id + "@correo.com").password("hash")
                .role(Usuario.Role.USER).puntos(120).monedas(999).createdAt(LocalDateTime.of(2026, 1, 5, 10, 0)).build();
    }

    private static Amistad fila(long a, long b, long solicitante, EstadoAmistad estado) {
        return Amistad.builder().id(50L).usuarioMenor(Math.min(a, b)).usuarioMayor(Math.max(a, b))
                .solicitanteId(solicitante).estado(estado).fechaSolicitud(LocalDateTime.of(2026, 11, 1, 9, 0)).build();
    }

    private void sonAmigos(long a, long b) {
        when(amistades.findByUsuarioMenorAndUsuarioMayor(Math.min(a, b), Math.max(a, b)))
                .thenReturn(Optional.of(fila(a, b, a, EstadoAmistad.ACEPTADA)));
    }

    private static void esperar(HttpStatus status, Runnable accion) {
        NegocioException e = assertThrows(NegocioException.class, accion::run);
        assertEquals(status, e.getStatus());
    }

    // ── Solicitudes de amistad ───────────────────────────────────────────────

    @Test
    void solicitudNuevaQuedaPendienteConParOrdenado() {
        SolicitudResultado r = amistadService.enviarSolicitud(LUIS, YO);

        assertEquals("ENVIADA", r.estado());
        ArgumentCaptor<Amistad> c = ArgumentCaptor.forClass(Amistad.class);
        verify(amistades).saveAndFlush(c.capture());
        assertEquals(YO, c.getValue().getUsuarioMenor());
        assertEquals(LUIS, c.getValue().getUsuarioMayor());
        assertEquals(LUIS, c.getValue().getSolicitanteId());
        assertEquals(EstadoAmistad.PENDIENTE, c.getValue().getEstado());
    }

    @Test
    void solicitudCruzadaSeAceptaAutomaticamente() {
        Amistad pendienteDeAna = fila(YO, ANA, ANA, EstadoAmistad.PENDIENTE);
        when(amistades.findByUsuarioMenorAndUsuarioMayor(YO, ANA)).thenReturn(Optional.of(pendienteDeAna));

        SolicitudResultado r = amistadService.enviarSolicitud(YO, ANA);

        assertEquals("AMIGOS", r.estado());
        assertEquals(EstadoAmistad.ACEPTADA, pendienteDeAna.getEstado());
        assertEquals(LocalDateTime.now(RELOJ), pendienteDeAna.getFechaAmistad());
        verify(amistades, never()).saveAndFlush(any(Amistad.class)); // no se crea una segunda fila
    }

    @Test
    void noSePuedeEnviarseSolicitudAUnoMismo() {
        esperar(HttpStatus.BAD_REQUEST, () -> amistadService.enviarSolicitud(YO, YO));
    }

    @Test
    void noSeDuplicanSolicitudesNiAmistades() {
        when(amistades.findByUsuarioMenorAndUsuarioMayor(YO, ANA))
                .thenReturn(Optional.of(fila(YO, ANA, YO, EstadoAmistad.PENDIENTE)));
        esperar(HttpStatus.CONFLICT, () -> amistadService.enviarSolicitud(YO, ANA));

        when(amistades.findByUsuarioMenorAndUsuarioMayor(YO, LUIS))
                .thenReturn(Optional.of(fila(YO, LUIS, LUIS, EstadoAmistad.ACEPTADA)));
        esperar(HttpStatus.CONFLICT, () -> amistadService.enviarSolicitud(YO, LUIS));
    }

    @Test
    void bloqueoImpideLaSolicitudEnAmbosSentidos() {
        // Yo bloqueé a Ana: debo desbloquearla primero.
        when(bloqueos.existsByBloqueadorIdAndBloqueadoId(YO, ANA)).thenReturn(true);
        esperar(HttpStatus.FORBIDDEN, () -> amistadService.enviarSolicitud(YO, ANA));

        // Luis me bloqueó: para mí no existe (no se filtra el bloqueo).
        when(bloqueos.existsByBloqueadorIdAndBloqueadoId(LUIS, YO)).thenReturn(true);
        esperar(HttpStatus.NOT_FOUND, () -> amistadService.enviarSolicitud(YO, LUIS));
        verify(amistades, never()).saveAndFlush(any(Amistad.class));
    }

    @Test
    void limiteDe100AmigosYDe20SolicitudesPendientes() {
        when(amistades.contarAmigos(YO, EstadoAmistad.ACEPTADA)).thenReturn(100L);
        esperar(HttpStatus.CONFLICT, () -> amistadService.enviarSolicitud(YO, ANA));

        when(amistades.contarAmigos(YO, EstadoAmistad.ACEPTADA)).thenReturn(5L);
        when(amistades.countBySolicitanteIdAndEstado(YO, EstadoAmistad.PENDIENTE)).thenReturn(20L);
        esperar(HttpStatus.CONFLICT, () -> amistadService.enviarSolicitud(YO, ANA));

        when(amistades.countBySolicitanteIdAndEstado(YO, EstadoAmistad.PENDIENTE)).thenReturn(19L);
        assertEquals("ENVIADA", amistadService.enviarSolicitud(YO, ANA).estado());
    }

    @Test
    void aceptarRespetaElLimiteDeAmigosDeAmbosLados() {
        when(amistades.findById(50L)).thenReturn(Optional.of(fila(YO, ANA, ANA, EstadoAmistad.PENDIENTE)));
        when(amistades.contarAmigos(ANA, EstadoAmistad.ACEPTADA)).thenReturn(100L);
        esperar(HttpStatus.CONFLICT, () -> amistadService.aceptar(YO, 50L));
    }

    @Test
    void soloElDestinatarioAceptaORechazaYSoloElRemitenteCancela() {
        Amistad deAna = fila(YO, ANA, ANA, EstadoAmistad.PENDIENTE);
        when(amistades.findById(50L)).thenReturn(Optional.of(deAna));

        esperar(HttpStatus.FORBIDDEN, () -> amistadService.aceptar(ANA, 50L)); // el remitente no acepta
        esperar(HttpStatus.FORBIDDEN, () -> amistadService.rechazar(ANA, 50L));
        esperar(HttpStatus.FORBIDDEN, () -> amistadService.cancelar(YO, 50L)); // el destinatario no cancela
        esperar(HttpStatus.NOT_FOUND, () -> amistadService.aceptar(LUIS, 50L)); // ajeno: no ve la solicitud

        assertEquals("AMIGOS", amistadService.aceptar(YO, 50L).estado());
        assertEquals(EstadoAmistad.ACEPTADA, deAna.getEstado());

        when(amistades.findById(51L)).thenReturn(Optional.of(fila(YO, ANA, ANA, EstadoAmistad.PENDIENTE)));
        assertEquals("RECHAZADA", amistadService.rechazar(YO, 51L).estado());
        assertEquals("CANCELADA", amistadService.cancelar(ANA, 51L).estado());
        verify(amistades, org.mockito.Mockito.times(2)).borrarPar(YO, ANA);
    }

    @Test
    void eliminarAmigoEsIdempotente() {
        amistadService.eliminarAmigo(YO, ANA);
        amistadService.eliminarAmigo(YO, ANA); // ya no existe: no lanza
        verify(amistades, org.mockito.Mockito.times(2)).borrarParConEstado(YO, ANA, EstadoAmistad.ACEPTADA);
    }

    // ── Bloqueo ──────────────────────────────────────────────────────────────

    @Test
    void bloquearRompeLaAmistadYEsIdempotente() {
        bloqueoService.bloquear(YO, ANA);
        verify(amistades).borrarPar(YO, ANA);
        verify(bloqueos).saveAndFlush(any());

        when(bloqueos.existsByBloqueadorIdAndBloqueadoId(YO, ANA)).thenReturn(true);
        bloqueoService.bloquear(YO, ANA); // segunda vez: no duplica
        verify(bloqueos, org.mockito.Mockito.times(1)).saveAndFlush(any());

        esperar(HttpStatus.BAD_REQUEST, () -> bloqueoService.bloquear(YO, YO));
    }

    // ── Mensajes privados ────────────────────────────────────────────────────

    private MensajePrivadoService mensajeService(MensajeRateLimiter limiter) {
        return new MensajePrivadoService(mensajes, bloqueos, usuarios, amistadService, resumen, limiter, ws, RELOJ);
    }

    private MensajePrivadoService mensajeService() {
        return mensajeService(new MensajeRateLimiter());
    }

    @Test
    void soloSePuedeEscribirAAmigos() {
        MensajePrivadoService s = mensajeService();
        esperar(HttpStatus.FORBIDDEN, () -> s.enviar(YO, ANA, "hola")); // sin amistad

        when(amistades.findByUsuarioMenorAndUsuarioMayor(YO, ANA))
                .thenReturn(Optional.of(fila(YO, ANA, YO, EstadoAmistad.PENDIENTE))); // pendiente no cuenta
        esperar(HttpStatus.FORBIDDEN, () -> s.enviar(YO, ANA, "hola"));

        sonAmigos(YO, ANA);
        when(bloqueos.existeEntre(YO, ANA)).thenReturn(true); // aun siendo amigos, el bloqueo manda
        esperar(HttpStatus.FORBIDDEN, () -> s.enviar(YO, ANA, "hola"));
        esperar(HttpStatus.FORBIDDEN, () -> s.listar(YO, ANA, null, null));
        verify(mensajes, never()).save(any(MensajePrivado.class));
    }

    @Test
    void validaTextoVacioLargoYLoRecorta() {
        sonAmigos(YO, ANA);
        when(mensajes.save(any(MensajePrivado.class))).thenAnswer(i -> {
            MensajePrivado m = i.getArgument(0);
            m.setId(10L);
            return m;
        });
        MensajePrivadoService s = mensajeService();

        esperar(HttpStatus.BAD_REQUEST, () -> s.enviar(YO, ANA, null));
        esperar(HttpStatus.BAD_REQUEST, () -> s.enviar(YO, ANA, "   \n "));
        esperar(HttpStatus.BAD_REQUEST, () -> s.enviar(YO, ANA, "a".repeat(501)));

        MensajeDTO ok = s.enviar(YO, ANA, "  <b>hola</b>  " + "");
        assertEquals("<b>hola</b>", ok.texto()); // se guarda tal cual (sin interpretar), solo recortado
        assertEquals(YO, ok.deId());
        assertEquals(ANA, ok.paraId());
        assertFalse(ok.leido());
        assertEquals(500, s.enviar(YO, ANA, " " + "a".repeat(500) + " ").texto().length()); // 500 exactos sí
    }

    @Test
    void publicaElMensajeEnLaColaPrivadaDelDestinatario() {
        sonAmigos(YO, ANA);
        when(mensajes.save(any(MensajePrivado.class))).thenAnswer(i -> {
            MensajePrivado m = i.getArgument(0);
            m.setId(10L);
            return m;
        });

        MensajeDTO dto = mensajeService().enviar(YO, ANA, "hola");

        verify(ws).convertAndSendToUser("2", "/queue/mensajes", dto);
        verify(ws, never()).convertAndSend(any(String.class), any(Object.class)); // nunca a un /topic
    }

    @Test
    void limiteDe30MensajesPorMinutoDevuelve429() {
        sonAmigos(YO, ANA);
        when(mensajes.save(any(MensajePrivado.class))).thenAnswer(i -> i.getArgument(0));
        AtomicLong t = new AtomicLong(0);
        MensajePrivadoService s = mensajeService(new MensajeRateLimiter(30, Duration.ofMinutes(1), t::get));

        for (int i = 0; i < 30; i++) {
            s.enviar(YO, ANA, "m" + i);
        }
        esperar(HttpStatus.TOO_MANY_REQUESTS, () -> s.enviar(YO, ANA, "uno más"));
        verify(mensajes, org.mockito.Mockito.times(30)).save(any(MensajePrivado.class));

        t.set(Duration.ofMinutes(1).toMillis() + 1); // ventana vencida
        s.enviar(YO, ANA, "otra vez");
    }

    @Test
    void limitadorEsPorUsuarioYDeslizante() {
        AtomicLong t = new AtomicLong(0);
        MensajeRateLimiter l = new MensajeRateLimiter(3, Duration.ofMinutes(1), t::get);
        assertTrue(l.permitir(1L));
        t.set(30_000);
        assertTrue(l.permitir(1L));
        assertTrue(l.permitir(1L));
        assertFalse(l.permitir(1L));
        assertTrue(l.permitir(2L)); // otro usuario no se ve afectado
        t.set(60_001); // sale solo el primero de la ventana
        assertTrue(l.permitir(1L));
        assertFalse(l.permitir(1L));
    }

    private static MensajePrivado fila(long id, long de, long para) {
        return MensajePrivado.builder().id(id).usuarioMenor(Math.min(de, para)).usuarioMayor(Math.max(de, para))
                .deId(de).paraId(para).texto("m" + id).fecha(LocalDateTime.of(2026, 11, 8, 10, 0)).build();
    }

    @Test
    void paginacionDevuelveOrdenCronologicoYHayMas() {
        sonAmigos(YO, ANA);
        // limite=3 -> se piden 4; el repositorio responde del más nuevo al más viejo
        when(mensajes.ultimos(eq(YO), eq(ANA), any(Pageable.class)))
                .thenReturn(List.of(fila(9, ANA, YO), fila(8, YO, ANA), fila(7, ANA, YO), fila(6, YO, ANA)));

        PaginaMensajes p = mensajeService().listar(YO, ANA, null, 3);

        assertTrue(p.hayMas());
        assertEquals(List.of(7L, 8L, 9L), p.mensajes().stream().map(MensajeDTO::id).toList());
        ArgumentCaptor<Pageable> c = ArgumentCaptor.forClass(Pageable.class);
        verify(mensajes).ultimos(eq(YO), eq(ANA), c.capture());
        assertEquals(4, c.getValue().getPageSize());
    }

    @Test
    void paginacionConAntesYLimiteMaximo() {
        sonAmigos(YO, ANA);
        when(mensajes.anteriores(eq(YO), eq(ANA), eq(7L), any(Pageable.class)))
                .thenReturn(List.of(fila(6, YO, ANA), fila(5, ANA, YO)));

        PaginaMensajes p = mensajeService().listar(YO, ANA, 7L, 500); // 500 se recorta a 50

        assertFalse(p.hayMas());
        assertEquals(List.of(5L, 6L), p.mensajes().stream().map(MensajeDTO::id).toList());
        ArgumentCaptor<Pageable> c = ArgumentCaptor.forClass(Pageable.class);
        verify(mensajes).anteriores(eq(YO), eq(ANA), eq(7L), c.capture());
        assertEquals(51, c.getValue().getPageSize());

        mensajeService().listar(YO, ANA, null, null); // por defecto: 30 (+1)
        verify(mensajes).ultimos(eq(YO), eq(ANA), org.mockito.ArgumentMatchers.argThat(pg -> pg.getPageSize() == 31));
    }

    @Test
    void noLeidosSoloCuentaMensajesDeAmigosYMarcarLeidoAvisaAlRemitente() {
        when(amistades.findAmigos(YO, EstadoAmistad.ACEPTADA))
                .thenReturn(List.of(fila(YO, ANA, ANA, EstadoAmistad.ACEPTADA)));
        when(mensajes.countByParaIdAndLeidoFalseAndDeIdIn(eq(YO), anyCollection())).thenReturn(4L);
        assertEquals(4L, mensajeService().totalNoLeidos(YO));
        verify(mensajes).countByParaIdAndLeidoFalseAndDeIdIn(YO, java.util.Set.of(ANA)); // no cuenta extraños

        when(mensajes.marcarLeidos(YO, ANA)).thenReturn(3);
        assertEquals(3, mensajeService().marcarLeidos(YO, ANA));
        verify(ws).convertAndSendToUser("2", "/queue/mensajes", Map.of("tipo", "leido", "deId", YO));

        when(mensajes.marcarLeidos(YO, LUIS)).thenReturn(0);
        mensajeService().marcarLeidos(YO, LUIS); // nada que marcar: no hay evento
        verify(ws, never()).convertAndSendToUser(eq("3"), any(String.class), any(Object.class));
    }

    @Test
    void conversacionesCortaA80YIndicaSiElUltimoEsMio() {
        when(amistades.findAmigos(YO, EstadoAmistad.ACEPTADA))
                .thenReturn(List.of(fila(YO, ANA, ANA, EstadoAmistad.ACEPTADA)));
        MensajePrivado largo = fila(9, YO, ANA);
        largo.setTexto("x".repeat(200));
        MensajePrivado deExtrano = fila(11, LUIS, YO); // no es amigo: no aparece
        when(mensajes.ultimosPorConversacion(YO)).thenReturn(List.of(deExtrano, largo));
        when(mensajes.noLeidosPorRemitente(eq(YO), anyCollection()))
                .thenReturn(java.util.Collections.singletonList(new Object[] { ANA, 2L }));

        List<SocialDTO.Conversacion> c = mensajeService().conversaciones(YO);

        assertEquals(1, c.size());
        assertEquals(80, c.get(0).ultimoMensaje().length());
        assertTrue(c.get(0).esMio());
        assertEquals(2L, c.get(0).noLeidos());
        assertEquals(ANA, c.get(0).usuario().id());
    }

    // ── Perfil público y búsqueda ────────────────────────────────────────────

    @Test
    void perfilNoExponeDatosPrivados() {
        List<String> campos = Arrays.stream(PerfilPublico.class.getRecordComponents())
                .map(RecordComponent::getName).toList();
        for (String prohibido : List.of("email", "monedas", "password", "latitud", "longitud", "ubicacion",
                "visitas", "historial", "pushSubscription", "genero")) {
            assertFalse(campos.contains(prohibido), "El perfil público no debe incluir " + prohibido);
        }
        assertTrue(campos.containsAll(List.of("id", "username", "nivel", "tituloRango", "puntos", "rachaDias",
                "equipados", "miembroDesde", "spotsDescubiertos", "comunasCompletas", "totalAmigos",
                "estadoAmistad", "solicitudId", "bloqueadoPorMi")));
    }

    @Test
    void perfilCalculaEstadoYSolicitud() {
        when(spots.countByCreadorId(ANA)).thenReturn(7L);
        when(sellos.countByUsuarioId(ANA)).thenReturn(2L);

        PerfilPublico ninguna = perfilService.perfil(YO, ANA);
        assertEquals("NINGUNA", ninguna.estadoAmistad());
        assertNull(ninguna.solicitudId());
        assertEquals(7L, ninguna.spotsDescubiertos());
        assertEquals(2L, ninguna.comunasCompletas());
        assertEquals(120, ninguna.puntos());

        assertEquals("YO", perfilService.perfil(YO, YO).estadoAmistad());

        when(amistades.findByUsuarioMenorAndUsuarioMayor(YO, ANA))
                .thenReturn(Optional.of(fila(YO, ANA, ANA, EstadoAmistad.PENDIENTE)));
        PerfilPublico recibida = perfilService.perfil(YO, ANA);
        assertEquals("RECIBIDA", recibida.estadoAmistad());
        assertEquals(50L, recibida.solicitudId());

        when(amistades.findByUsuarioMenorAndUsuarioMayor(YO, ANA))
                .thenReturn(Optional.of(fila(YO, ANA, YO, EstadoAmistad.PENDIENTE)));
        assertEquals("ENVIADA", perfilService.perfil(YO, ANA).estadoAmistad());

        when(amistades.findByUsuarioMenorAndUsuarioMayor(YO, ANA))
                .thenReturn(Optional.of(fila(YO, ANA, ANA, EstadoAmistad.ACEPTADA)));
        PerfilPublico amigos = perfilService.perfil(YO, ANA);
        assertEquals("AMIGOS", amigos.estadoAmistad());
        assertNull(amigos.solicitudId());
    }

    @Test
    void perfilBloqueadoYOcultoSiMeBloquearon() {
        when(bloqueos.existsByBloqueadorIdAndBloqueadoId(YO, ANA)).thenReturn(true);
        PerfilPublico p = perfilService.perfil(YO, ANA);
        assertEquals("BLOQUEADO", p.estadoAmistad());
        assertTrue(p.bloqueadoPorMi());

        when(bloqueos.existsByBloqueadorIdAndBloqueadoId(LUIS, YO)).thenReturn(true);
        esperar(HttpStatus.NOT_FOUND, () -> perfilService.perfil(YO, LUIS));
        esperar(HttpStatus.NOT_FOUND, () -> perfilService.perfil(YO, 999L)); // inexistente: mismo 404
    }

    @Test
    void busquedaExigeDosCaracteresYEscapaComodines() {
        esperar(HttpStatus.BAD_REQUEST, () -> perfilService.buscar(YO, null));
        esperar(HttpStatus.BAD_REQUEST, () -> perfilService.buscar(YO, " a "));
        esperar(HttpStatus.BAD_REQUEST, () -> perfilService.buscar(YO, "x".repeat(51)));

        assertEquals("50!%!_!!", PerfilPublicoService.escaparLike("50%_!"));

        when(usuarios.buscarPorNombre(anyLong(), any(String.class), any(String.class), any(Pageable.class)))
                .thenReturn(new ArrayList<>(List.of(usuario(ANA))));
        List<SocialDTO.UsuarioBusqueda> r = perfilService.buscar(YO, " A_% ");

        verify(usuarios).buscarPorNombre(eq(YO), eq("%a!_!%%"), eq("a!_!%%"),
                org.mockito.ArgumentMatchers.argThat(pg -> pg.getPageSize() == 20));
        assertEquals(1, r.size());
        assertEquals("NINGUNA", r.get(0).estadoAmistad());
    }
}
