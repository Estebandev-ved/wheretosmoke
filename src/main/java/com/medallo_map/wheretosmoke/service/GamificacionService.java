package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.medallo_map.wheretosmoke.dto.PerfilGamificacionDTO;
import com.medallo_map.wheretosmoke.model.Badge;
import com.medallo_map.wheretosmoke.model.InventarioUsuario;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.FotoRepository;
import com.medallo_map.wheretosmoke.repository.InventarioUsuarioRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * 🏆 SERVICIO DE GAMIFICACIÓN
 * 
 * Maneja puntos, badges y leaderboard.
 */
@Service
@RequiredArgsConstructor
public class GamificacionService {

    private final UsuarioRepository usuarioRepository;
    private final FotoRepository fotoRepository;
    private final InventarioUsuarioRepository inventarioRepository;
    private final Clock clock;

    // ⚙️ CONFIGURACIÓN DE PUNTOS
    private static final int PUNTOS_CREAR_SPOT = 10;
    private static final int PUNTOS_REPORTE = 5;
    private static final int PUNTOS_COMENTARIO = 3;
    private static final int PUNTOS_FOTO = 5;
    private static final int PUNTOS_CALIFICACION = 2;

    /**
     * 🎖️ Agregar puntos a un usuario
     */
    public void agregarPuntos(Long usuarioId, int puntos) {
        usuarioRepository.findById(usuarioId).ifPresent(usuario -> {
            usuario.setPuntos(usuario.getPuntos() + puntos);
            verificarYAsignarBadges(usuario);
            usuarioRepository.save(usuario);
        });
    }

    /**
     * 📍 Puntos por crear spot
     */
    public void puntosPorCrearSpot(Long usuarioId) {
        usuarioRepository.findById(usuarioId).ifPresent(usuario -> {
            usuario.setPuntos(usuario.getPuntos() + PUNTOS_CREAR_SPOT);
            usuario.setSpotsCreados(usuario.getSpotsCreados() + 1);
            verificarYAsignarBadges(usuario);
            usuarioRepository.save(usuario);
        });
    }

    /**
     * 🚨 Puntos por reportar
     */
    public void puntosPorReporte(Long usuarioId) {
        usuarioRepository.findById(usuarioId).ifPresent(usuario -> {
            usuario.setPuntos(usuario.getPuntos() + PUNTOS_REPORTE);
            usuario.setReportesHechos(usuario.getReportesHechos() + 1);
            verificarYAsignarBadges(usuario);
            usuarioRepository.save(usuario);
        });
    }

    /**
     * 💬 Puntos por comentar
     */
    public void puntosPorComentario(Long usuarioId) {
        usuarioRepository.findById(usuarioId).ifPresent(usuario -> {
            usuario.setPuntos(usuario.getPuntos() + PUNTOS_COMENTARIO);
            usuario.setComentariosHechos(usuario.getComentariosHechos() + 1);
            verificarYAsignarBadges(usuario);
            usuarioRepository.save(usuario);
        });
    }

    /**
     * 📸 Puntos por subir foto
     */
    public void puntosPorFoto(Long usuarioId) {
        agregarPuntos(usuarioId, PUNTOS_FOTO);
    }

    /**
     * ⭐ Puntos por calificar
     */
    public void puntosPorCalificacion(Long usuarioId) {
        agregarPuntos(usuarioId, PUNTOS_CALIFICACION);
    }

    /**
     * 🏅 Verificar y asignar badges
     */
    private void verificarYAsignarBadges(Usuario usuario) {
        List<Badge> badgesActuales = parseBadges(usuario.getBadges());
        List<Badge> nuevosBadges = new ArrayList<>(badgesActuales);

        // 🚀 PIONERO: Primer spot
        if (usuario.getSpotsCreados() >= 1 && !badgesActuales.contains(Badge.PIONERO)) {
            nuevosBadges.add(Badge.PIONERO);
        }

        // 👁️ CENTINELA: 10 reportes
        if (usuario.getReportesHechos() >= 10 && !badgesActuales.contains(Badge.CENTINELA)) {
            nuevosBadges.add(Badge.CENTINELA);
        }

        // 🛡️ GUARDIÁN: 50 reportes
        if (usuario.getReportesHechos() >= 50 && !badgesActuales.contains(Badge.GUARDIAN)) {
            nuevosBadges.add(Badge.GUARDIAN);
        }

        // 💬 COMENTARISTA: 10 comentarios
        if (usuario.getComentariosHechos() >= 10 && !badgesActuales.contains(Badge.COMENTARISTA)) {
            nuevosBadges.add(Badge.COMENTARISTA);
        }

        // 📸 FOTÓGRAFO: 5 fotos
        int fotosSubidas = fotoRepository.countByUsuarioId(usuario.getId());
        if (fotosSubidas >= 5 && !badgesActuales.contains(Badge.FOTOGRAFO)) {
            nuevosBadges.add(Badge.FOTOGRAFO);
        }

        // 👑 LEYENDA: 500 puntos
        if (usuario.getPuntos() >= 500 && !badgesActuales.contains(Badge.LEYENDA)) {
            nuevosBadges.add(Badge.LEYENDA);
        }

        // Guardar badges
        usuario.setBadges(badgesToString(nuevosBadges));
    }

    /**
     * 📊 Obtener perfil de gamificación
     */
    public PerfilGamificacionDTO obtenerPerfil(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Badge> badgesGanados = parseBadges(usuario.getBadges());
        int fotosSubidas = fotoRepository.countByUsuarioId(usuarioId);

        // Calcular posición en leaderboard
        int posicion = calcularPosicionLeaderboard(usuarioId);

        // Siguiente badge
        Badge siguienteBadge = calcularSiguienteBadge(usuario, badgesGanados);
        int puntosFaltantes = siguienteBadge != null ? calcularPuntosFaltantes(usuario, siguienteBadge) : 0;

        PerfilGamificacionDTO perfil = PerfilGamificacionDTO.builder()
                .usuarioId(usuario.getId())
                .username(usuario.getUsername())
                .puntos(usuario.getPuntos())
                .badgesGanados(badgesGanados)
                .posicionLeaderboard(posicion)
                .spotsCreados(usuario.getSpotsCreados())
                .reportesHechos(usuario.getReportesHechos())
                .comentariosHechos(usuario.getComentariosHechos())
                .fotosSubidas(fotosSubidas)
                .siguienteBadge(siguienteBadge)
                .puntosFaltantes(puntosFaltantes)
                .build();

        // Gamificación v2: nivel, rango, monedas, racha y cosméticos equipados
        completarNivel(perfil, usuario);
        LocalDate hoy = LocalDate.now(clock);
        Integer saldo = usuarioRepository.obtenerMonedas(usuarioId);
        perfil.setMonedas(saldo == null ? 0 : saldo);
        perfil.setRachaDias(ReglasGamificacion.rachaVigente(usuario.getUltimaActividad(), hoy, usuario.getRachaDias()));
        perfil.setCheckinHoy(hoy.equals(usuario.getUltimaActividad()));
        perfil.setCofreDisponible(!hoy.equals(usuario.getUltimoCofre()));
        perfil.setMultiplicadorEvento(ReglasGamificacion.multiplicadorEvento(clock));
        Map<String, String> equipados = new LinkedHashMap<>();
        inventarioRepository.findByUsuarioId(usuarioId).stream()
                .filter(InventarioUsuario::isEquipado)
                .forEach(i -> equipados.put(i.getArticulo().getCategoria().name(), i.getArticulo().getImagen()));
        perfil.setEquipados(equipados);
        return perfil;
    }

    /** Rellena nivel, título de rango y umbrales de XP según usuarios.puntos (ver ReglasGamificacion). */
    private void completarNivel(PerfilGamificacionDTO perfil, Usuario usuario) {
        int nivel = ReglasGamificacion.nivelPara(usuario.getPuntos());
        perfil.setNivel(nivel);
        perfil.setTituloRango(ReglasGamificacion.tituloRango(nivel));
        perfil.setXpNivelActual(ReglasGamificacion.xpParaNivel(nivel));
        perfil.setXpSiguienteNivel(nivel >= ReglasGamificacion.NIVEL_MAX ? null
                : ReglasGamificacion.xpParaNivel(nivel + 1));
    }

    /**
     * 🏆 Obtener leaderboard (top 10)
     */
    public List<PerfilGamificacionDTO> obtenerLeaderboard() {
        return usuarioRepository.findAll(PageRequest.of(0, 10,
                org.springframework.data.domain.Sort.by("puntos").descending()))
                .stream()
                .map(usuario -> {
                    PerfilGamificacionDTO p = PerfilGamificacionDTO.builder()
                            .usuarioId(usuario.getId())
                            .username(usuario.getUsername())
                            .puntos(usuario.getPuntos())
                            .badgesGanados(parseBadges(usuario.getBadges()))
                            .spotsCreados(usuario.getSpotsCreados())
                            .reportesHechos(usuario.getReportesHechos())
                            .build();
                    completarNivel(p, usuario); // nivel y rango son públicos; monedas no
                    return p;
                })
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛠️ MÉTODOS AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    private List<Badge> parseBadges(String badgesJson) {
        if (badgesJson == null || badgesJson.isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(badgesJson.replace("[", "").replace("]", "").replace("\"", "").split(","))
                .filter(s -> !s.trim().isEmpty())
                .map(s -> Badge.valueOf(s.trim()))
                .collect(Collectors.toList());
    }

    private String badgesToString(List<Badge> badges) {
        return "[" + badges.stream()
                .map(Badge::name)
                .collect(Collectors.joining(",")) + "]";
    }

    private int calcularPosicionLeaderboard(Long usuarioId) {
        List<Usuario> todos = usuarioRepository.findAll(
                org.springframework.data.domain.Sort.by("puntos").descending());
        for (int i = 0; i < todos.size(); i++) {
            if (todos.get(i).getId().equals(usuarioId)) {
                return i + 1;
            }
        }
        return -1;
    }

    private Badge calcularSiguienteBadge(Usuario usuario, List<Badge> badgesGanados) {
        if (!badgesGanados.contains(Badge.PIONERO))
            return Badge.PIONERO;
        if (!badgesGanados.contains(Badge.CENTINELA))
            return Badge.CENTINELA;
        if (!badgesGanados.contains(Badge.COMENTARISTA))
            return Badge.COMENTARISTA;
        if (!badgesGanados.contains(Badge.FOTOGRAFO))
            return Badge.FOTOGRAFO;
        if (!badgesGanados.contains(Badge.GUARDIAN))
            return Badge.GUARDIAN;
        if (!badgesGanados.contains(Badge.LEYENDA))
            return Badge.LEYENDA;
        return null;
    }

    private int calcularPuntosFaltantes(Usuario usuario, Badge badge) {
        switch (badge) {
            case PIONERO:
                return usuario.getSpotsCreados() >= 1 ? 0 : 1;
            case CENTINELA:
                return Math.max(0, 10 - usuario.getReportesHechos());
            case GUARDIAN:
                return Math.max(0, 50 - usuario.getReportesHechos());
            case COMENTARISTA:
                return Math.max(0, 10 - usuario.getComentariosHechos());
            case LEYENDA:
                return Math.max(0, 500 - usuario.getPuntos());
            default:
                return 0;
        }
    }
}
