package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.SocialDTO.PaginaPersonas;
import com.medallo_map.wheretosmoke.dto.SocialDTO.PersonaSugerida;
import com.medallo_map.wheretosmoke.dto.SocialDTO.Privacidad;
import com.medallo_map.wheretosmoke.dto.SocialDTO.UsuarioMini;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Amistad;
import com.medallo_map.wheretosmoke.model.CirculoConfianza;
import com.medallo_map.wheretosmoke.model.EstadoAmistad;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.AmistadRepository;
import com.medallo_map.wheretosmoke.repository.BloqueoRepository;
import com.medallo_map.wheretosmoke.repository.CirculoConfianzaRepository;
import com.medallo_map.wheretosmoke.repository.PersonasRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * "GENTE QUE QUIZÁS CONOZCAS": sugerencias con puntaje explicable, descubrimiento con filtros y privacidad.
 * Puntaje = amigos en común (peso alto) + círculos compartidos + comunas con visitas recientes de ambos
 * + nivel cercano + actividad reciente; desempate por id. Todo en lote (sin N+1).
 */
@Service
@RequiredArgsConstructor
public class PersonasService {

    public static final int LIMITE_DEFECTO = 20;
    public static final int LIMITE_MAX = 30;
    public static final int MAX_EN_COMUN = 50;
    public static final int DIAS_COMUNA = 30;
    public static final int DIAS_ACTIVO = 7;
    public static final int DIAS_NUEVO = 14;
    static final int RELLENO = 60;

    static final int PESO_AMIGO = 10;
    static final int TOPE_AMIGOS = 8;
    static final int PESO_CIRCULO = 8;
    static final int TOPE_CIRCULOS = 3;
    static final int PESO_COMUNA = 4;
    static final int TOPE_COMUNAS = 3;
    static final int PESO_NIVEL = 2;
    static final int PESO_ACTIVO = 1;
    static final int PESO_NUEVO = 1;
    static final int DIFERENCIA_NIVEL = 3;

    public static final Set<String> MODOS = Set.of("TODOS", "AMIGOS_DE_AMIGOS", "NADIE");
    private static final Set<String> ORDENES = Set.of("activos", "nuevos", "nivel");

    private final UsuarioRepository usuarioRepository;
    private final AmistadRepository amistadRepository;
    private final BloqueoRepository bloqueoRepository;
    private final CirculoConfianzaRepository circuloRepository;
    private final PersonasRepository personasRepository;
    private final UsuarioResumenService resumen;
    private final Clock clock;

    /** Señales acumuladas de un candidato. */
    private static final class Senales {
        int amigos;
        final Set<String> circulos = new TreeSet<>();
        final Set<String> comunas = new TreeSet<>();
    }

    private record Puntuada(Usuario usuario, int puntaje, int amigos, List<String> razones) {
    }

    // ── Sugeridas ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PaginaPersonas sugeridas(Long yo, Integer pagina, Integer limite) {
        int p = pagina(pagina);
        int lim = limite(limite);
        Usuario mio = usuarioRepository.findById(yo).orElseThrow(
                () -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        LocalDate hoy = LocalDate.now(clock);
        LocalDateTime ahora = LocalDateTime.now(clock);

        Set<Long> amigos = idsAmigos(yo);
        Set<Long> excluidos = new HashSet<>(amigos);
        excluidos.add(yo);
        excluidos.addAll(bloqueoRepository.idsBloqueadosPor(yo));
        excluidos.addAll(bloqueoRepository.idsQueMeBloquearon(yo));

        Map<Long, Senales> senales = new HashMap<>();

        if (!amigos.isEmpty()) {
            for (Object[] f : personasRepository.amigosEnComunDeTodos(amigos)) {
                senales.computeIfAbsent(id(f[0]), k -> new Senales()).amigos = ((Number) f[1]).intValue();
            }
        }

        List<CirculoConfianza> misCirculos = circuloRepository.findCirculosByUsuario(yo);
        if (!misCirculos.isEmpty()) {
            Map<Long, String> nombres = new HashMap<>();
            misCirculos.forEach(c -> nombres.put(c.getId(), c.getNombre()));
            for (Object[] f : personasRepository.miembrosDeCirculos(nombres.keySet(), yo)) {
                String nombre = nombres.get(id(f[1]));
                if (nombre != null) {
                    senales.computeIfAbsent(id(f[0]), k -> new Senales()).circulos.add(nombre);
                }
            }
        }

        LocalDate desde = hoy.minusDays(DIAS_COMUNA);
        List<String> misComunas = personasRepository.comunasRecientes(yo, desde);
        if (!misComunas.isEmpty()) {
            for (Object[] f : personasRepository.usuariosEnComunas(yo, misComunas, desde)) {
                senales.computeIfAbsent(id(f[0]), k -> new Senales()).comunas.add((String) f[1]);
            }
        }

        // Candidatos con señal, filtrados por exclusiones y privacidad.
        Set<Long> conSenal = new HashSet<>(senales.keySet());
        conSenal.removeAll(excluidos);
        Map<Long, Usuario> candidatos = new HashMap<>();
        for (Usuario u : resumen.usuarios(conSenal).values()) {
            if (elegible(u, excluidos)) {
                candidatos.put(u.getId(), u);
            }
        }
        // Relleno: los más activos y los más nuevos, por si hay pocos candidatos con señal.
        List<Usuario> relleno = new ArrayList<>(
                usuarioRepository.personasActivas(yo, "%", "", PageRequest.of(0, RELLENO)).getContent());
        relleno.addAll(usuarioRepository.personasNuevas(yo, "%", "", PageRequest.of(0, RELLENO / 2)).getContent());
        for (Usuario u : relleno) {
            if (elegible(u, excluidos)) {
                candidatos.putIfAbsent(u.getId(), u);
            }
        }

        int nivelMio = UsuarioResumenService.nivel(mio);
        List<Puntuada> ordenadas = new ArrayList<>();
        for (Usuario u : candidatos.values()) {
            ordenadas.add(puntuar(u, senales.get(u.getId()), nivelMio, ahora));
        }
        ordenadas.sort(Comparator.comparingInt((Puntuada x) -> -x.puntaje())
                .thenComparingLong(x -> x.usuario().getId()));

        int inicio = p * lim;
        if (inicio >= ordenadas.size()) {
            return new PaginaPersonas(List.of(), false);
        }
        boolean hayMas = ordenadas.size() > inicio + lim;
        List<Puntuada> pagina_ = ordenadas.subList(inicio, Math.min(ordenadas.size(), inicio + lim));
        List<Long> ids = pagina_.stream().map(x -> x.usuario().getId()).toList();
        Map<Long, Amistad> relaciones = relaciones(yo, ids);
        Map<Long, Map<String, String>> equipados = resumen.equipados(ids);
        List<PersonaSugerida> items = new ArrayList<>();
        for (Puntuada x : pagina_) {
            items.add(persona(x.usuario(), equipados, relaciones, yo, x.amigos(), x.razones(), x.puntaje()));
        }
        return new PaginaPersonas(items, hayMas);
    }

    private Puntuada puntuar(Usuario u, Senales s, int nivelMio, LocalDateTime ahora) {
        int puntaje = 0;
        int amigos = 0;
        List<String> razones = new ArrayList<>();
        if (s != null && s.amigos > 0) {
            amigos = s.amigos;
            puntaje += Math.min(s.amigos, TOPE_AMIGOS) * PESO_AMIGO;
            razones.add(s.amigos == 1 ? "1 amigo en común" : s.amigos + " amigos en común");
        }
        if (s != null && !s.circulos.isEmpty()) {
            puntaje += Math.min(s.circulos.size(), TOPE_CIRCULOS) * PESO_CIRCULO;
            razones.add(s.circulos.size() == 1 ? "Está en tu círculo " + s.circulos.iterator().next()
                    : "Comparten " + s.circulos.size() + " círculos");
        }
        if (s != null && !s.comunas.isEmpty()) {
            puntaje += Math.min(s.comunas.size(), TOPE_COMUNAS) * PESO_COMUNA;
            razones.add(razonComunas(new ArrayList<>(s.comunas)));
        }
        if (Math.abs(UsuarioResumenService.nivel(u) - nivelMio) <= DIFERENCIA_NIVEL) {
            puntaje += PESO_NIVEL;
            razones.add("Nivel parecido");
        }
        if (u.getLastLogin() != null && u.getLastLogin().isAfter(ahora.minusDays(DIAS_ACTIVO))) {
            puntaje += PESO_ACTIVO;
            razones.add("Activo recientemente");
        }
        if (u.getCreatedAt() != null && u.getCreatedAt().isAfter(ahora.minusDays(DIAS_NUEVO))) {
            puntaje += PESO_NUEVO;
            razones.add("Nuevo en Peguelo");
        }
        return new Puntuada(u, puntaje, amigos, razones);
    }

    static String razonComunas(List<String> comunas) {
        if (comunas.size() == 1) {
            return "Activo en " + comunas.get(0) + " como tú";
        }
        if (comunas.size() == 2) {
            return "Activo en " + comunas.get(0) + " y " + comunas.get(1) + " como tú";
        }
        return "Activo en " + comunas.get(0) + " y " + (comunas.size() - 1) + " comunas más como tú";
    }

    // ── Descubrir ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PaginaPersonas descubrir(Long yo, String q, String comuna, String orden, Integer pagina, Integer limite) {
        int p = pagina(pagina);
        int lim = limite(limite);
        String ord = orden == null || orden.isBlank() ? "activos" : orden.trim().toLowerCase(Locale.ROOT);
        if (!ORDENES.contains(ord)) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "Orden no válido (activos, nuevos o nivel)");
        }
        String limpio = q == null ? "" : q.trim();
        if (!limpio.isEmpty() && limpio.length() < PerfilPublicoService.MIN_BUSQUEDA) {
            throw new NegocioException(HttpStatus.BAD_REQUEST,
                    "Escribe al menos " + PerfilPublicoService.MIN_BUSQUEDA + " caracteres para buscar");
        }
        if (limpio.length() > PerfilPublicoService.MAX_BUSQUEDA) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "La búsqueda es demasiado larga");
        }
        String zona = comuna == null ? "" : comuna.trim();
        if (zona.length() > 60) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "Comuna no válida");
        }
        String patron = limpio.isEmpty() ? "%"
                : "%" + PerfilPublicoService.escaparLike(limpio.toLowerCase(Locale.ROOT)) + "%";
        PageRequest pr = PageRequest.of(p, lim);
        Slice<Usuario> slice = switch (ord) {
            case "nuevos" -> usuarioRepository.personasNuevas(yo, patron, zona, pr);
            case "nivel" -> usuarioRepository.personasPorNivel(yo, patron, zona, pr);
            default -> usuarioRepository.personasActivas(yo, patron, zona, pr);
        };
        List<Usuario> encontrados = slice.getContent();
        if (encontrados.isEmpty()) {
            return new PaginaPersonas(List.of(), false);
        }
        List<Long> ids = encontrados.stream().map(Usuario::getId).toList();
        Map<Long, Integer> enComun = enComunCon(yo, ids);
        Map<Long, Amistad> relaciones = relaciones(yo, ids);
        Map<Long, Map<String, String>> equipados = resumen.equipados(ids);
        List<PersonaSugerida> items = new ArrayList<>();
        for (Usuario u : encontrados) {
            int n = enComun.getOrDefault(u.getId(), 0);
            List<String> razones = new ArrayList<>();
            if (n > 0) {
                razones.add(n == 1 ? "1 amigo en común" : n + " amigos en común");
            }
            if (!zona.isEmpty()) {
                razones.add("Activo en " + zona);
            }
            items.add(persona(u, equipados, relaciones, yo, n, razones, n * PESO_AMIGO));
        }
        return new PaginaPersonas(items, slice.hasNext());
    }

    // ── Amigos en común ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UsuarioMini> amigosEnComun(Long yo, Long otroId) {
        if (otroId == null || yo.equals(otroId)) {
            return List.of();
        }
        Usuario otro = usuarioRepository.findById(otroId).orElse(null);
        if (otro == null || !otro.isActivo() || bloqueoRepository.existeEntre(yo, otroId)) {
            throw new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        Set<Long> mios = idsAmigos(yo);
        if (mios.isEmpty()) {
            return List.of();
        }
        List<Long> comunes = amistadRepository.findRelacionesCon(otroId, mios).stream()
                .filter(a -> a.getEstado() == EstadoAmistad.ACEPTADA).map(a -> a.otroDe(otroId))
                .sorted().limit(MAX_EN_COMUN).toList();
        if (comunes.isEmpty()) {
            return List.of();
        }
        Map<Long, Usuario> usuarios = resumen.usuarios(comunes);
        Map<Long, Map<String, String>> equipados = resumen.equipados(comunes);
        return comunes.stream().filter(usuarios::containsKey)
                .map(i -> UsuarioResumenService.mini(usuarios.get(i), equipados)).toList();
    }

    // ── Privacidad ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Privacidad privacidad(Long yo) {
        Usuario u = usuarioRepository.findById(yo).orElseThrow(
                () -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return new Privacidad(u.visibleEnSugerencias(), u.modoSolicitudes());
    }

    @Transactional
    public Privacidad actualizarPrivacidad(Long yo, Privacidad nueva) {
        if (nueva == null) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "Petición inválida");
        }
        Usuario u = usuarioRepository.findById(yo).orElseThrow(
                () -> new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        String modo = nueva.aceptaSolicitudes() == null ? u.modoSolicitudes()
                : nueva.aceptaSolicitudes().trim().toUpperCase(Locale.ROOT);
        if (!MODOS.contains(modo)) {
            throw new NegocioException(HttpStatus.BAD_REQUEST,
                    "aceptaSolicitudes debe ser TODOS, AMIGOS_DE_AMIGOS o NADIE");
        }
        boolean visible = nueva.visibleEnSugerencias() == null ? u.visibleEnSugerencias()
                : nueva.visibleEnSugerencias();
        usuarioRepository.actualizarPrivacidad(yo, visible, modo);
        return new Privacidad(visible, modo);
    }

    // ── Utilidades ───────────────────────────────────────────────────────────

    private Set<Long> idsAmigos(Long yo) {
        Set<Long> out = new HashSet<>();
        for (Amistad a : amistadRepository.findAmigos(yo, EstadoAmistad.ACEPTADA)) {
            out.add(a.otroDe(yo));
        }
        return out;
    }

    /** Amigos en común con cada id de la lista, en una sola consulta. */
    Map<Long, Integer> enComunCon(Long yo, Collection<Long> ids) {
        Map<Long, Integer> out = new HashMap<>();
        Set<Long> mios = idsAmigos(yo);
        if (mios.isEmpty() || ids.isEmpty()) {
            return out;
        }
        for (Object[] f : personasRepository.amigosEnComunCon(mios, ids)) {
            out.put(id(f[0]), ((Number) f[1]).intValue());
        }
        return out;
    }

    private Map<Long, Amistad> relaciones(Long yo, Collection<Long> ids) {
        Map<Long, Amistad> out = new HashMap<>();
        amistadRepository.findRelacionesCon(yo, ids).forEach(a -> out.put(a.otroDe(yo), a));
        return out;
    }

    private static boolean elegible(Usuario u, Set<Long> excluidos) {
        return u.isActivo() && u.visibleEnSugerencias() && !excluidos.contains(u.getId());
    }

    private static PersonaSugerida persona(Usuario u, Map<Long, Map<String, String>> equipados,
            Map<Long, Amistad> relaciones, Long yo, int amigos, List<String> razones, int puntaje) {
        int nivel = UsuarioResumenService.nivel(u);
        return new PersonaSugerida(u.getId(), u.getUsername(), nivel, ReglasGamificacion.tituloRango(nivel),
                equipados.getOrDefault(u.getId(), Map.of()),
                AmistadService.estadoDe(relaciones.get(u.getId()), yo), amigos, razones, puntaje);
    }

    private static Long id(Object o) {
        return ((Number) o).longValue();
    }

    static int pagina(Integer pagina) {
        return pagina == null ? 0 : Math.max(0, Math.min(pagina, 10_000));
    }

    static int limite(Integer limite) {
        if (limite == null) {
            return LIMITE_DEFECTO;
        }
        return Math.max(1, Math.min(limite, LIMITE_MAX));
    }
}
