package com.medallo_map.wheretosmoke.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.medallo_map.wheretosmoke.dto.*;
import com.medallo_map.wheretosmoke.model.*;
import com.medallo_map.wheretosmoke.repository.*;

import lombok.RequiredArgsConstructor;

/**
 * 📍 SERVICIO DE DETALLE DE SPOTS
 * 
 * Maneja fotos, comentarios, calificaciones, favoritos e historial.
 */
@Service
@RequiredArgsConstructor
public class SpotDetalleService {

    private final SpotRepository spotRepository;
    private final FotoRepository fotoRepository;
    private final ComentarioRepository comentarioRepository;
    private final CalificacionRepository calificacionRepository;
    private final FavoritoRepository favoritoRepository;
    private final HistorialAlertaRepository historialAlertaRepository;
    private final UsuarioRepository usuarioRepository;
    private final GamificacionService gamificacionService;

    // ═══════════════════════════════════════════════════════════════
    // 📍 DETALLE COMPLETO DE SPOT
    // ═══════════════════════════════════════════════════════════════

    public SpotDetalleDTO obtenerDetalleSpot(Long spotId, Long usuarioId) {
        Spot spot = spotRepository.findById(spotId)
                .orElseThrow(() -> new RuntimeException("Spot no encontrado"));

        SpotDetalleDTO dto = SpotDetalleDTO.fromSpot(spot);

        // Cargar fotos
        List<FotoDTO> fotos = fotoRepository.findBySpotIdOrderByFechaSubidaDesc(spotId)
                .stream()
                .map(FotoDTO::fromFoto)
                .collect(Collectors.toList());
        dto.setFotos(fotos);
        dto.setTotalFotos(fotos.size());

        // Cargar comentarios
        List<ComentarioDTO> comentarios = comentarioRepository.findBySpotIdOrderByFechaDesc(spotId)
                .stream()
                .map(ComentarioDTO::fromComentario)
                .collect(Collectors.toList());
        dto.setComentarios(comentarios);
        dto.setTotalComentarios(comentarios.size());

        // Cargar calificaciones detalladas
        dto.setCalificacionesDetalle(obtenerCalificacionesDetalle(spotId));
        dto.setTotalCalificaciones(calificacionRepository.countBySpotId(spotId));

        // Historial de alertas
        List<HistorialAlertaDTO> historial = historialAlertaRepository
                .findTop50BySpotIdOrderByTimestampDesc(spotId)
                .stream()
                .map(HistorialAlertaDTO::fromHistorialAlerta)
                .collect(Collectors.toList());
        dto.setHistorialAlertas(historial);
        dto.setPatronesAlerta(calcularPatronesAlerta(spotId));

        // Favoritos
        dto.setTotalFavoritos(favoritoRepository.countBySpotId(spotId));
        if (usuarioId != null) {
            dto.setEsFavorito(favoritoRepository.existsByUsuarioIdAndSpotId(usuarioId, spotId));
        }

        // Info del creador
        if (spot.getCreadorId() != null) {
            usuarioRepository.findById(spot.getCreadorId())
                    .ifPresent(u -> dto.setCreadorNombre(u.getUsername()));
        }

        return dto;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📸 FOTOS
    // ═══════════════════════════════════════════════════════════════

    public FotoDTO subirFoto(Long spotId, Long usuarioId, String imageData, String descripcion) {
        Spot spot = spotRepository.findById(spotId)
                .orElseThrow(() -> new RuntimeException("Spot no encontrado"));

        Foto foto = Foto.builder()
                .spotId(spotId)
                .usuarioId(usuarioId)
                .imageData(imageData)
                .descripcion(descripcion)
                .fechaSubida(LocalDateTime.now())
                .likes(0)
                .build();

        foto = fotoRepository.save(foto);

        // Actualizar contador del spot
        spot.setCantidadFotos(fotoRepository.countBySpotId(spotId));
        spotRepository.save(spot);

        // Dar puntos
        if (usuarioId != null) {
            gamificacionService.puntosPorFoto(usuarioId);
        }

        FotoDTO dto = FotoDTO.fromFoto(foto);
        if (usuarioId != null) {
            usuarioRepository.findById(usuarioId)
                    .ifPresent(u -> dto.setUsuarioNombre(u.getUsername()));
        }

        return dto;
    }

    public List<FotoDTO> obtenerFotos(Long spotId) {
        return fotoRepository.findBySpotIdOrderByFechaSubidaDesc(spotId)
                .stream()
                .map(foto -> {
                    FotoDTO dto = FotoDTO.fromFoto(foto);
                    if (foto.getUsuarioId() != null) {
                        usuarioRepository.findById(foto.getUsuarioId())
                                .ifPresent(u -> dto.setUsuarioNombre(u.getUsername()));
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════
    // 💬 COMENTARIOS
    // ═══════════════════════════════════════════════════════════════

    public ComentarioDTO agregarComentario(Long spotId, Long usuarioId, String texto) {
        Spot spot = spotRepository.findById(spotId)
                .orElseThrow(() -> new RuntimeException("Spot no encontrado"));

        String nombreUsuario = "Anónimo";
        if (usuarioId != null) {
            nombreUsuario = usuarioRepository.findById(usuarioId)
                    .map(Usuario::getUsername)
                    .orElse("Anónimo");
        }

        Comentario comentario = Comentario.builder()
                .spotId(spotId)
                .usuarioId(usuarioId)
                .usuarioNombre(nombreUsuario)
                .texto(texto)
                .fecha(LocalDateTime.now())
                .likes(0)
                .build();

        comentario = comentarioRepository.save(comentario);

        // Actualizar contador del spot
        spot.setCantidadComentarios(comentarioRepository.countBySpotId(spotId));
        spotRepository.save(spot);

        // Dar puntos
        if (usuarioId != null) {
            gamificacionService.puntosPorComentario(usuarioId);
        }

        return ComentarioDTO.fromComentario(comentario);
    }

    public List<ComentarioDTO> obtenerComentarios(Long spotId) {
        return comentarioRepository.findBySpotIdOrderByFechaDesc(spotId)
                .stream()
                .map(ComentarioDTO::fromComentario)
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════
    // ⭐ CALIFICACIONES
    // ═══════════════════════════════════════════════════════════════

    public CalificacionesDetalleDTO calificarSpot(Long spotId, Long usuarioId,
            Integer estrellas, Integer privacidad, Integer ambiente,
            Integer vista, Integer accesibilidad) {

        Spot spot = spotRepository.findById(spotId)
                .orElseThrow(() -> new RuntimeException("Spot no encontrado"));

        // Verificar si ya calificó
        Calificacion calificacion = calificacionRepository.findBySpotIdAndUsuarioId(spotId, usuarioId)
                .orElse(new Calificacion());

        calificacion.setSpotId(spotId);
        calificacion.setUsuarioId(usuarioId);
        calificacion.setEstrellas(estrellas);
        calificacion.setPrivacidad(privacidad);
        calificacion.setAmbiente(ambiente);
        calificacion.setVista(vista);
        calificacion.setAccesibilidad(accesibilidad);
        calificacion.setFecha(LocalDateTime.now());

        calificacionRepository.save(calificacion);

        // Actualizar promedio del spot
        Double promedio = calificacionRepository.calcularPromedioEstrellas(spotId);
        spot.setCalificacionPromedio(promedio);
        spotRepository.save(spot);

        // Dar puntos (solo si es nueva)
        if (calificacion.getId() == null && usuarioId != null) {
            gamificacionService.puntosPorCalificacion(usuarioId);
        }

        return obtenerCalificacionesDetalle(spotId);
    }

    private CalificacionesDetalleDTO obtenerCalificacionesDetalle(Long spotId) {
        Double promedioGeneral = calificacionRepository.calcularPromedioEstrellas(spotId);
        Object[] promedios = calificacionRepository.calcularPromediosAspectos(spotId);
        int total = calificacionRepository.countBySpotId(spotId);

        Double privacidad = null, ambiente = null, vista = null, accesibilidad = null;
        if (promedios != null && promedios.length == 4) {
            privacidad = (Double) promedios[0];
            ambiente = (Double) promedios[1];
            vista = (Double) promedios[2];
            accesibilidad = (Double) promedios[3];
        }

        return CalificacionesDetalleDTO.builder()
                .promedioGeneral(promedioGeneral)
                .promedioPrivacidad(privacidad)
                .promedioAmbiente(ambiente)
                .promedioVista(vista)
                .promedioAccesibilidad(accesibilidad)
                .totalCalificaciones(total)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 HISTORIAL Y PATRONES
    // ═══════════════════════════════════════════════════════════════

    public void registrarAlertaEnHistorial(Long spotId, String tipoAlerta) {
        LocalDateTime ahora = LocalDateTime.now();

        HistorialAlerta alerta = HistorialAlerta.builder()
                .spotId(spotId)
                .tipoAlerta(tipoAlerta)
                .timestamp(ahora)
                .diaSemana(ahora.getDayOfWeek().getValue())
                .horaDia(ahora.getHour())
                .build();

        historialAlertaRepository.save(alerta);
    }

    private PatronesAlertaDTO calcularPatronesAlerta(Long spotId) {
        List<Object[]> porDia = historialAlertaRepository.contarAlertasPorDia(spotId);
        List<Object[]> porHora = historialAlertaRepository.contarAlertasPorHora(spotId);

        Map<Integer, Integer> alertasPorDia = new HashMap<>();
        Map<Integer, Integer> alertasPorHora = new HashMap<>();
        int maxDia = 0, diaMasPeligroso = 0;
        int maxHora = 0, horaMasPeligrosa = 0;

        for (Object[] row : porDia) {
            int dia = (Integer) row[0];
            int count = ((Long) row[1]).intValue();
            alertasPorDia.put(dia, count);
            if (count > maxDia) {
                maxDia = count;
                diaMasPeligroso = dia;
            }
        }

        for (Object[] row : porHora) {
            int hora = (Integer) row[0];
            int count = ((Long) row[1]).intValue();
            alertasPorHora.put(hora, count);
            if (count > maxHora) {
                maxHora = count;
                horaMasPeligrosa = hora;
            }
        }

        // Generar resumen
        String[] diasNombre = { "", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo" };
        String resumen = "";
        if (diaMasPeligroso > 0 && horaMasPeligrosa >= 0) {
            resumen = String.format("⚠️ Más peligroso los %s a las %d:00",
                    diasNombre[diaMasPeligroso], horaMasPeligrosa);
        }

        return PatronesAlertaDTO.builder()
                .alertasPorDia(alertasPorDia)
                .alertasPorHora(alertasPorHora)
                .diaMasPeligroso(diaMasPeligroso)
                .horaMasPeligrosa(horaMasPeligrosa)
                .resumen(resumen)
                .build();
    }
}
