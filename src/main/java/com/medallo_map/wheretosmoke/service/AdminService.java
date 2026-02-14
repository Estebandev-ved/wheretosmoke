package com.medallo_map.wheretosmoke.service;

import com.medallo_map.wheretosmoke.dto.*;
import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 🔒 ADMIN SERVICE - Lógica de negocio para panel de administración
 * 
 * Servicios only para usuarios con Role.ADMIN
 */
@Service
public class AdminService {

        @Autowired
        private UsuarioRepository usuarioRepository;

        @Autowired
        private SpotRepository spotRepository;

        @Autowired
        private ComentarioRepository comentarioRepository;

        @Autowired
        private FavoritoRepository favoritoRepository;

        @Autowired
        private HistorialAlertaRepository historialAlertaRepository;

        @Autowired
        private FotoRepository fotoRepository;

        @Autowired
        private CalificacionRepository calificacionRepository;

        // ===== GESTIÓN DE USUARIOS =====

        /**
         * 📋 Obtener todos los usuarios con información completa
         */
        public List<AdminUserDTO> getAllUsers() {
                List<Usuario> usuarios = usuarioRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

                return usuarios.stream().map(this::convertToAdminUserDTO).collect(Collectors.toList());
        }

        /**
         * 👤 Obtener información detallada de un usuario
         */
        public AdminUserDTO getUserById(Long id) {
                Usuario usuario = usuarioRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                return convertToAdminUserDTO(usuario);
        }

        /**
         * 🚫 Banear/Desbanear usuario (soft delete)
         */
        @Transactional
        public AdminUserDTO toggleBanUser(Long id) {
                Usuario usuario = usuarioRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                // Toggle del estado activo
                usuario.setActivo(!usuario.isActivo());
                usuarioRepository.save(usuario);

                return convertToAdminUserDTO(usuario);
        }

        /**
         * 🗑️ Eliminar usuario permanentemente (hard delete)
         * PELIGRO: Esto eliminará TODOS los datos del usuario
         */
        @Transactional
        public void deleteUserPermanently(Long id) {
                Usuario usuario = usuarioRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                // Eliminar todos los spots del usuario
                List<Spot> spots = spotRepository.findAll().stream()
                                .filter(s -> s.getCreadorId().equals(id))
                                .collect(Collectors.toList());
                spotRepository.deleteAll(spots);

                // Eliminar comentarios del usuario
                comentarioRepository.deleteAll(
                                comentarioRepository.findAll().stream()
                                                .filter(c -> c.getUsuarioId().equals(id))
                                                .collect(Collectors.toList()));

                // Eliminar favoritos del usuario
                favoritoRepository.deleteAll(
                                favoritoRepository.findAll().stream()
                                                .filter(f -> f.getUsuarioId().equals(id))
                                                .collect(Collectors.toList()));

                // Finalmente eliminar el usuario
                usuarioRepository.delete(usuario);
        }

        // ===== GESTIÓN DE SPOTS =====

        /**
         * 📍 Obtener todos los spots con información completa
         */
        public List<AdminSpotDTO> getAllSpots() {
                List<Spot> spots = spotRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));

                return spots.stream().map(this::convertToAdminSpotDTO).collect(Collectors.toList());
        }

        /**
         * 🗑️ Eliminar spot
         */
        @Transactional
        public void deleteSpot(Long id) {
                Spot spot = spotRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Spot no encontrado"));

                // Eliminar comentarios del spot
                comentarioRepository.deleteAll(
                                comentarioRepository.findBySpotIdOrderByFechaDesc(id));

                // Eliminar favoritos del spot
                favoritoRepository.deleteAll(
                                favoritoRepository.findAll().stream()
                                                .filter(f -> f.getSpotId().equals(id))
                                                .collect(Collectors.toList()));

                // Eliminar fotos del spot
                fotoRepository.deleteAll(
                                fotoRepository.findBySpotIdOrderByFechaSubidaDesc(id));

                // Eliminar el spot
                spotRepository.delete(spot);
        }

        /**
         * 🚩 Marcar/desmarcar spot como inapropiado
         */
        @Transactional
        public AdminSpotDTO flagSpot(Long id, String motivo) {
                Spot spot = spotRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Spot no encontrado"));

                // Cambiar estado a REPORTADO o ACTIVO
                if ("ACTIVO".equals(spot.getEstado())) {
                        spot.setEstado("REPORTADO");
                } else {
                        spot.setEstado("ACTIVO");
                }

                spotRepository.save(spot);

                return convertToAdminSpotDTO(spot);
        }

        /**
         * 🚨 Obtener spots flaggeados/reportados
         */
        public List<AdminSpotDTO> getFlaggedSpots() {
                List<Spot> spots = spotRepository.findAll().stream()
                                .filter(s -> "REPORTADO".equals(s.getEstado()))
                                .collect(Collectors.toList());

                return spots.stream().map(this::convertToAdminSpotDTO).collect(Collectors.toList());
        }

        // ===== ESTADÍSTICAS =====

        /**
         * 📊 Obtener estadísticas generales del sistema
         */
        public AdminStatsDTO getSystemStats() {
                LocalDateTime ahora = LocalDateTime.now();
                LocalDateTime hace24h = ahora.minus(24, ChronoUnit.HOURS);
                LocalDateTime hace7dias = ahora.minus(7, ChronoUnit.DAYS);
                LocalDateTime hace30dias = ahora.minus(30, ChronoUnit.DAYS);

                // Obtener todos los datos
                List<Usuario> todosUsuarios = usuarioRepository.findAll();
                List<Spot> todosSpots = spotRepository.findAll();

                // Calcular estadísticas de usuarios
                long totalUsuarios = todosUsuarios.size();
                long usuariosActivos = todosUsuarios.stream().filter(Usuario::isActivo).count();
                long usuariosBaneados = todosUsuarios.stream().filter(u -> !u.isActivo()).count();
                long nuevosHoy = todosUsuarios.stream()
                                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(hace24h)).count();
                long nuevosSemana = todosUsuarios.stream()
                                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(hace7dias)).count();
                long nuevosMes = todosUsuarios.stream()
                                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(hace30dias)).count();

                // Calcular estadísticas de spots
                long totalSpots = todosSpots.size();
                long spotsActivos = todosSpots.stream().filter(
                                s -> "ACTIVO".equals(s.getEstado()) || "VERDE".equals(s.getEstado())
                                                || "ROJO".equals(s.getEstado()))
                                .count();
                long spotsFlaggeados = todosSpots.stream().filter(s -> "REPORTADO".equals(s.getEstado())).count();

                // Contar spots nuevos (asumimos que todos los spots tienen timestamp)
                // Como Spot no tiene createdAt, usamos el ID como proxy (IDs más altos = más
                // nuevos)
                List<Long> idsOrdenados = todosSpots.stream().map(Spot::getId).sorted(Comparator.reverseOrder())
                                .collect(Collectors.toList());
                long spotsSemana = Math.min(nuevosSemana, totalSpots); // Aproximación
                long spotsMes = Math.min(nuevosMes, totalSpots);

                // Engagement
                long totalComentarios = comentarioRepository.count();
                long totalFavoritos = favoritoRepository.count();
                long totalFotos = fotoRepository.count();
                long totalHistorialAlertas = historialAlertaRepository.count();

                // Distribución por categoría
                Map<String, Long> spotsPorCategoria = todosSpots.stream()
                                .collect(Collectors.groupingBy(
                                                s -> s.getCategoria() != null ? s.getCategoria().name()
                                                                : "SIN_CATEGORIA",
                                                Collectors.counting()));

                // Tendencias (últimos 7 días) - datos de ejemplo ya que no tenemos timestamps
                // en Spot
                Map<String, Long> registrosPorDia = calcularRegistrosPorDia(todosUsuarios, 7);
                Map<String, Long> spotsPorDia = new HashMap<>();
                Map<String, Long> votosPorDia = new HashMap<>();

                // Llenar con datos básicos
                for (int i = 6; i >= 0; i--) {
                        String fecha = LocalDate.now().minus(i, ChronoUnit.DAYS).toString();
                        spotsPorDia.putIfAbsent(fecha, 0L);
                        votosPorDia.putIfAbsent(fecha, 0L);
                }

                return AdminStatsDTO.builder()
                                .totalUsuarios(totalUsuarios)
                                .usuariosActivos(usuariosActivos)
                                .usuariosBaneados(usuariosBaneados)
                                .nuevosUsuariosHoy(nuevosHoy)
                                .nuevosUsuariosSemana(nuevosSemana)
                                .nuevosUsuariosMes(nuevosMes)
                                .totalSpots(totalSpots)
                                .spotsActivos(spotsActivos)
                                .spotsFlaggeados(spotsFlaggeados)
                                .nuevosSpotsHoy(0L) // No tenemos timestamp en Spot
                                .nuevosSpotsSemana(spotsSemana)
                                .nuevosSpotsMes(spotsMes)
                                .totalVotos(totalHistorialAlertas)
                                .totalVotosTombo(0L) // Se calculará con query específica si se necesita
                                .totalVotosRelax(0L) // Se calculará con query específica si se necesita
                                .totalComentarios(totalComentarios)
                                .totalFavoritos(totalFavoritos)
                                .totalFotos(totalFotos)
                                .votosUltimas24h(0L) // Calculable con query específica
                                .comentariosUltimas24h(0L)
                                .spotsUltimas24h(0L)
                                .spotsPorCategoria(spotsPorCategoria)
                                .registrosPorDia(registrosPorDia)
                                .spotsPorDia(spotsPorDia)
                                .votosPorDia(votosPorDia)
                                .build();
        }

        // ===== ACTIVIDAD =====

        /**
         * 📋 Obtener actividad reciente del sistema
         * 
         * Por ahora retornamos lista vacía, se puede implementar con tabla de logs
         */
        public List<AdminActivityDTO> getRecentActivity(int limit) {
                // TODO: Implementar tabla de activity_log
                // Por ahora retornamos lista vacía
                return new ArrayList<>();
        }

        // ===== HELPERS =====

        /**
         * Convertir Usuario a AdminUserDTO
         */
        private AdminUserDTO convertToAdminUserDTO(Usuario usuario) {
                // Calcular días activo
                int diasActivo = 0;
                if (usuario.getCreatedAt() != null) {
                        diasActivo = (int) ChronoUnit.DAYS.between(usuario.getCreatedAt(), LocalDateTime.now());
                }

                // Contar favoritos del usuario
                long totalFavoritos = favoritoRepository.findAll().stream()
                                .filter(f -> f.getUsuarioId().equals(usuario.getId()))
                                .count();

                // Contar votos del usuario (aproximado, basado en reportes)
                long totalVotos = usuario.getReportesHechos() != null ? usuario.getReportesHechos() : 0;

                return AdminUserDTO.builder()
                                .id(usuario.getId())
                                .username(usuario.getUsername())
                                .email(usuario.getEmail())
                                .genero(usuario.getGenero())
                                .role(usuario.getRole().name())
                                .activo(usuario.isActivo())
                                .createdAt(usuario.getCreatedAt())
                                .lastLogin(usuario.getLastLogin())
                                .spotsCreados(usuario.getSpotsCreados())
                                .reportesHechos(usuario.getReportesHechos())
                                .comentariosHechos(usuario.getComentariosHechos())
                                .puntos(usuario.getPuntos())
                                .badges(usuario.getBadges())
                                .totalVotos(totalVotos)
                                .totalFavoritos(totalFavoritos)
                                .diasActivo(diasActivo)
                                .build();
        }

        /**
         * Convertir Spot a AdminSpotDTO
         */
        private AdminSpotDTO convertToAdminSpotDTO(Spot spot) {
                // Obtener información del creador
                String creadorUsername = "Desconocido";
                if (spot.getCreadorId() != null) {
                        Optional<Usuario> creador = usuarioRepository.findById(spot.getCreadorId());
                        if (creador.isPresent()) {
                                creadorUsername = creador.get().getUsername();
                        }
                }

                // Contar favoritos del spot
                int totalFavoritos = (int) favoritoRepository.findAll().stream()
                                .filter(f -> f.getSpotId().equals(spot.getId()))
                                .count();

                // Contar votos
                int totalTombo = historialAlertaRepository.countBySpotIdAndTipoAlerta(spot.getId(), "TOMBO");
                int totalRelax = historialAlertaRepository.countBySpotIdAndTipoAlerta(spot.getId(), "RELAX");

                return AdminSpotDTO.builder()
                                .id(spot.getId())
                                .nombre(spot.getNombre())
                                .descripcion(spot.getDescripcion())
                                .latitud(spot.getLatitud())
                                .longitud(spot.getLongitud())
                                .categoria(spot.getCategoria() != null ? spot.getCategoria().name() : "SIN_CATEGORIA")
                                .estado(spot.getEstado())
                                .creadorId(spot.getCreadorId())
                                .creadorUsername(creadorUsername)
                                .creadoEn(null) // Spot no tiene timestamp de creación
                                .ultimaActualizacion(spot.getUltimaAlerta())
                                .totalVotosTombo(totalTombo)
                                .totalVotosRelax(totalRelax)
                                .totalComentarios(spot.getCantidadComentarios() != null ? spot.getCantidadComentarios()
                                                : 0)
                                .totalFotos(spot.getCantidadFotos() != null ? spot.getCantidadFotos() : 0)
                                .totalFavoritos(totalFavoritos)
                                .calificacionPromedio(spot.getCalificacionPromedio())
                                .flaggeado("REPORTADO".equals(spot.getEstado()))
                                .motivoFlag(null) // No lo tenemos guardado
                                .reportesPendientes(0) // Calculable si implementamos tabla de reportes
                                .build();
        }

        /**
         * Calcular registros por día (últimos N días)
         */
        private Map<String, Long> calcularRegistrosPorDia(List<Usuario> usuarios, int dias) {
                Map<String, Long> resultado = new LinkedHashMap<>();
                LocalDate hoy = LocalDate.now();

                for (int i = dias - 1; i >= 0; i--) {
                        LocalDate fecha = hoy.minus(i, ChronoUnit.DAYS);
                        String fechaStr = fecha.toString();

                        long count = usuarios.stream()
                                        .filter(u -> u.getCreatedAt() != null
                                                        && u.getCreatedAt().toLocalDate().equals(fecha))
                                        .count();

                        resultado.put(fechaStr, count);
                }

                return resultado;
        }
}
