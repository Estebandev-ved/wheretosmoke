package com.medallo_map.wheretosmoke.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.CirculoDTO;
import com.medallo_map.wheretosmoke.model.CirculoConfianza;
import com.medallo_map.wheretosmoke.model.MiembroCirculo;
import com.medallo_map.wheretosmoke.model.UbicacionTiempoReal;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.CirculoConfianzaRepository;
import com.medallo_map.wheretosmoke.repository.MiembroCirculoRepository;
import com.medallo_map.wheretosmoke.repository.UbicacionTiempoRealRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

@Service
public class CirculoConfianzaService {

    @Autowired
    private CirculoConfianzaRepository circuloRepository;

    @Autowired
    private MiembroCirculoRepository miembroRepository;

    @Autowired
    private UbicacionTiempoRealRepository ubicacionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    /**
     * Crear un nuevo circulo de confianza
     */
    @Transactional
    public CirculoConfianza crearCirculo(String nombre, Long creadorId, String color) {
        CirculoConfianza circulo = new CirculoConfianza();
        circulo.setNombre(nombre);
        circulo.setCreadorId(creadorId);
        circulo.setColor(color != null ? color : "#4CAF50");
        circulo.setFechaCreacion(LocalDateTime.now());
        circulo.generarCodigoInvitacion();

        circulo = circuloRepository.save(circulo);

        // Agregar al creador como miembro automaticamente
        MiembroCirculo miembro = new MiembroCirculo();
        miembro.setCirculoId(circulo.getId());
        miembro.setUsuarioId(creadorId);
        miembro.setFechaUnion(LocalDateTime.now());
        miembroRepository.save(miembro);

        return circulo;
    }

    /**
     * Unirse a un circulo usando codigo de invitacion
     */
    @Transactional
    public boolean unirseACirculo(String codigoInvitacion, Long usuarioId) {
        Optional<CirculoConfianza> circuloOpt = circuloRepository.findByCodigoInvitacion(codigoInvitacion);

        if (circuloOpt.isEmpty() || !circuloOpt.get().getActivo()) {
            return false;
        }

        CirculoConfianza circulo = circuloOpt.get();

        // Verificar si ya es miembro
        Optional<MiembroCirculo> miembroExistente = miembroRepository
                .findByCirculoIdAndUsuarioId(circulo.getId(), usuarioId);

        if (miembroExistente.isPresent()) {
            // Reactivar si estaba inactivo
            MiembroCirculo miembro = miembroExistente.get();
            if (!miembro.getActivo()) {
                miembro.setActivo(true);
                miembro.setFechaUnion(LocalDateTime.now());
                miembroRepository.save(miembro);
            }
            return true;
        }

        // Crear nuevo miembro
        MiembroCirculo nuevoMiembro = new MiembroCirculo();
        nuevoMiembro.setCirculoId(circulo.getId());
        nuevoMiembro.setUsuarioId(usuarioId);
        nuevoMiembro.setFechaUnion(LocalDateTime.now());
        miembroRepository.save(nuevoMiembro);

        return true;
    }

    /**
     * Obtener circulos de un usuario
     */
    public List<CirculoDTO> obtenerCirculosDeUsuario(Long usuarioId) {
        List<CirculoConfianza> circulos = circuloRepository.findCirculosByUsuario(usuarioId);

        return circulos.stream().map(circulo -> {
            List<MiembroCirculo> miembros = miembroRepository.findByCirculoIdAndActivoTrue(circulo.getId());

            List<CirculoDTO.MiembroDTO> miembrosDTO = miembros.stream().map(miembro -> {
                Usuario usuario = usuarioRepository.findById(miembro.getUsuarioId()).orElse(null);

                CirculoDTO.UbicacionDTO ubicacionDTO = null;
                if (miembro.getCompartiendoUbicacion()) {
                    Optional<UbicacionTiempoReal> ubicacion = ubicacionRepository
                            .findByUsuarioIdAndCirculoId(miembro.getUsuarioId(), circulo.getId());

                    if (ubicacion.isPresent()) {
                        UbicacionTiempoReal u = ubicacion.get();
                        ubicacionDTO = CirculoDTO.UbicacionDTO.builder()
                                .latitud(u.getLatitud())
                                .longitud(u.getLongitud())
                                .timestamp(u.getTimestamp())
                                .enSpotId(u.getEnSpotId())
                                .build();
                    }
                }

                return CirculoDTO.MiembroDTO.builder()
                        .usuarioId(miembro.getUsuarioId())
                        .username(usuario != null ? usuario.getUsername() : "Usuario")
                        .compartiendoUbicacion(miembro.getCompartiendoUbicacion())
                        .ubicacionActual(ubicacionDTO)
                        .build();
            }).collect(Collectors.toList());

            return CirculoDTO.builder()
                    .id(circulo.getId())
                    .nombre(circulo.getNombre())
                    .creadorId(circulo.getCreadorId())
                    .codigoInvitacion(circulo.getCodigoInvitacion())
                    .fechaCreacion(circulo.getFechaCreacion())
                    .color(circulo.getColor())
                    .totalMiembros(miembros.size())
                    .miembros(miembrosDTO)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Actualizar ubicacion de un usuario en un circulo
     */
    @Transactional
    public void actualizarUbicacion(Long circuloId, Long usuarioId,
            Double latitud, Double longitud, Long enSpotId) {
        // Verificar que el usuario sea miembro del circulo
        Optional<MiembroCirculo> miembroOpt = miembroRepository
                .findByCirculoIdAndUsuarioId(circuloId, usuarioId);

        if (miembroOpt.isEmpty() || !miembroOpt.get().getActivo()) {
            throw new RuntimeException("Usuario no es miembro del circulo");
        }

        // Activar compartir ubicacion si no esta activo
        MiembroCirculo miembro = miembroOpt.get();
        if (!miembro.getCompartiendoUbicacion()) {
            miembro.setCompartiendoUbicacion(true);
            miembroRepository.save(miembro);
        }

        // Crear o actualizar ubicacion
        Optional<UbicacionTiempoReal> ubicacionOpt = ubicacionRepository
                .findByUsuarioIdAndCirculoId(usuarioId, circuloId);

        Point location = geometryFactory.createPoint(new Coordinate(longitud, latitud));

        UbicacionTiempoReal ubicacion;
        if (ubicacionOpt.isPresent()) {
            ubicacion = ubicacionOpt.get();
            ubicacion.setLocation(location);
            ubicacion.setTimestamp(LocalDateTime.now());
            ubicacion.setEnSpotId(enSpotId);
        } else {
            ubicacion = new UbicacionTiempoReal();
            ubicacion.setUsuarioId(usuarioId);
            ubicacion.setCirculoId(circuloId);
            ubicacion.setLocation(location);
            ubicacion.setTimestamp(LocalDateTime.now());
            ubicacion.setEnSpotId(enSpotId);
        }

        ubicacionRepository.save(ubicacion);

        // Broadcast via WebSocket
        CirculoDTO.UbicacionDTO ubicacionDTO = CirculoDTO.UbicacionDTO.builder()
                .latitud(latitud)
                .longitud(longitud)
                .timestamp(ubicacion.getTimestamp())
                .enSpotId(enSpotId)
                .build();

        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("usuarioId", usuarioId);
        payload.put("ubicacion", ubicacionDTO);
        messagingTemplate.convertAndSend("/topic/circulo/" + circuloId + "/ubicaciones", (Object) payload);
    }

    /**
     * Dejar de compartir ubicacion
     */
    @Transactional
    public void detenerCompartirUbicacion(Long circuloId, Long usuarioId) {
        miembroRepository.actualizarEstadoCompartirUbicacion(circuloId, usuarioId, false);
        ubicacionRepository.eliminarUbicacion(usuarioId, circuloId);

        // Notificar via WebSocket
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("usuarioId", usuarioId);
        payload.put("accion", "detenido");
        messagingTemplate.convertAndSend("/topic/circulo/" + circuloId + "/ubicaciones", (Object) payload);
    }

    /**
     * Salir de un circulo
     */
    @Transactional
    public void salirDeCirculo(Long circuloId, Long usuarioId) {
        Optional<MiembroCirculo> miembroOpt = miembroRepository
                .findByCirculoIdAndUsuarioId(circuloId, usuarioId);

        if (miembroOpt.isPresent()) {
            MiembroCirculo miembro = miembroOpt.get();
            miembro.setActivo(false);
            miembro.setCompartiendoUbicacion(false);
            miembroRepository.save(miembro);

            // Eliminar ubicacion
            ubicacionRepository.eliminarUbicacion(usuarioId, circuloId);
        }
    }

    /**
     * Tarea programada: limpiar ubicaciones viejas (mas de 1 hora)
     */
    @Scheduled(fixedRate = 300000) // Cada 5 minutos
    @Transactional
    public void limpiarUbicacionesViejas() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(1);
        ubicacionRepository.eliminarUbicacionesViejas(cutoff);
    }
}
