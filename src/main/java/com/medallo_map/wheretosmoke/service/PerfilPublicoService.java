package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.SocialDTO.PerfilPublico;
import com.medallo_map.wheretosmoke.dto.SocialDTO.UsuarioBusqueda;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Amistad;
import com.medallo_map.wheretosmoke.model.EstadoAmistad;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.AmistadRepository;
import com.medallo_map.wheretosmoke.repository.BloqueoRepository;
import com.medallo_map.wheretosmoke.repository.SelloComunaRepository;
import com.medallo_map.wheretosmoke.repository.SpotRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * PERFIL PÚBLICO Y BÚSQUEDA DE PERSONAS.
 * Privacidad: nunca se expone email, monedas, ubicación ni historial de spots visitados.
 */
@Service
@RequiredArgsConstructor
public class PerfilPublicoService {

    public static final int MIN_BUSQUEDA = 2;
    public static final int MAX_BUSQUEDA = 50;
    public static final int MAX_RESULTADOS = 20;
    /** Carácter de escape de LIKE usado en UsuarioRepository.buscarPorNombre. */
    static final char ESCAPE = '!';

    private final UsuarioRepository usuarioRepository;
    private final AmistadRepository amistadRepository;
    private final BloqueoRepository bloqueoRepository;
    private final SpotRepository spotRepository;
    private final SelloComunaRepository selloRepository;
    private final UsuarioResumenService resumen;
    private final Clock clock;

    /** Escapa los comodines LIKE (% _) y el propio carácter de escape para que el texto sea literal. */
    public static String escaparLike(String texto) {
        StringBuilder sb = new StringBuilder(texto.length() + 4);
        for (char c : texto.toCharArray()) {
            if (c == ESCAPE || c == '%' || c == '_') {
                sb.append(ESCAPE);
            }
            sb.append(c);
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<UsuarioBusqueda> buscar(Long yo, String q) {
        String limpio = q == null ? "" : q.trim();
        if (limpio.length() < MIN_BUSQUEDA) {
            throw new NegocioException(HttpStatus.BAD_REQUEST,
                    "Escribe al menos " + MIN_BUSQUEDA + " caracteres para buscar");
        }
        if (limpio.length() > MAX_BUSQUEDA) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "La búsqueda es demasiado larga");
        }
        String base = escaparLike(limpio.toLowerCase(Locale.ROOT));
        List<Usuario> encontrados = usuarioRepository.buscarPorNombre(yo, "%" + base + "%", base + "%",
                PageRequest.of(0, MAX_RESULTADOS));
        if (encontrados.isEmpty()) {
            return List.of();
        }
        List<Long> ids = encontrados.stream().map(Usuario::getId).toList();
        Map<Long, Amistad> relaciones = new HashMap<>();
        amistadRepository.findRelacionesCon(yo, ids).forEach(a -> relaciones.put(a.otroDe(yo), a));
        Map<Long, Map<String, String>> equipados = resumen.equipados(ids);
        return encontrados.stream().map(u -> {
            int nivel = UsuarioResumenService.nivel(u);
            return new UsuarioBusqueda(u.getId(), u.getUsername(), nivel, ReglasGamificacion.tituloRango(nivel),
                    equipados.getOrDefault(u.getId(), Map.of()),
                    AmistadService.estadoDe(relaciones.get(u.getId()), yo));
        }).toList();
    }

    @Transactional(readOnly = true)
    public PerfilPublico perfil(Long yo, Long id) {
        Usuario u = usuarioRepository.findById(id).orElse(null);
        // Quien me bloqueó "no existe" para mí: mismo 404 que un id inexistente.
        if (u == null || (!yo.equals(id) && bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(id, yo))) {
            throw new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        int nivel = UsuarioResumenService.nivel(u);
        LocalDate hoy = LocalDate.now(clock);
        Map<String, String> equipados = resumen.equipados(List.of(id)).getOrDefault(id, Map.of());

        String estado;
        Long solicitudId = null;
        boolean bloqueadoPorMi = false;
        if (yo.equals(id)) {
            estado = "YO";
        } else if (bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(yo, id)) {
            estado = "BLOQUEADO";
            bloqueadoPorMi = true;
        } else {
            Amistad a = amistadRepository
                    .findByUsuarioMenorAndUsuarioMayor(AmistadService.menor(yo, id), AmistadService.mayor(yo, id))
                    .orElse(null);
            estado = AmistadService.estadoDe(a, yo);
            if (a != null && a.getEstado() == EstadoAmistad.PENDIENTE) {
                solicitudId = a.getId();
            }
        }
        return new PerfilPublico(u.getId(), u.getUsername(), nivel, ReglasGamificacion.tituloRango(nivel),
                u.getPuntos() == null ? 0 : u.getPuntos(),
                ReglasGamificacion.rachaVigente(u.getUltimaActividad(), hoy, u.getRachaDias()),
                equipados, u.getCreatedAt(), spotRepository.countByCreadorId(id),
                selloRepository.countByUsuarioId(id),
                amistadRepository.contarAmigos(id, EstadoAmistad.ACEPTADA),
                estado, solicitudId, bloqueadoPorMi);
    }
}
