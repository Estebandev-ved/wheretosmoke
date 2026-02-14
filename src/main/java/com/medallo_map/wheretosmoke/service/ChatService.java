package com.medallo_map.wheretosmoke.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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

import com.medallo_map.wheretosmoke.model.ChatMensaje;
import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.ChatRepository;
import com.medallo_map.wheretosmoke.repository.SpotRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

@Service
public class ChatService {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private SpotRepository spotRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private static final double DISTANCIA_MAXIMA_METROS = 50.0; // 50 metros

    /**
     * Validar que el usuario este cerca del spot (menos de 50m)
     */
    private boolean validarDistancia(Long spotId, Double latitud, Double longitud) {
        Spot spot = spotRepository.findById(spotId).orElse(null);
        if (spot == null || spot.getLatitud() == null || spot.getLongitud() == null) {
            return false;
        }

        // Calculo simple de distancia usando Haversine
        double distancia = calcularDistanciaHaversine(
                spot.getLatitud(), spot.getLongitud(),
                latitud, longitud);

        return distancia <= DISTANCIA_MAXIMA_METROS;
    }

    private double calcularDistanciaHaversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Radio de la Tierra en metros
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Enviar mensaje al chat de un spot
     */
    @Transactional
    public ChatMensaje enviarMensaje(Long spotId, Long usuarioId, String mensaje,
            Double latitud, Double longitud) {
        // Validar distancia
        if (!validarDistancia(spotId, latitud, longitud)) {
            throw new RuntimeException("Debes estar a menos de 50m del spot para chatear");
        }

        // Crear mensaje
        ChatMensaje chatMensaje = new ChatMensaje();
        chatMensaje.setSpotId(spotId);
        chatMensaje.setUsuarioId(usuarioId);
        chatMensaje.setMensaje(mensaje);
        chatMensaje.setLocation(geometryFactory.createPoint(new Coordinate(longitud, latitud)));
        chatMensaje.setTimestamp(LocalDateTime.now());

        chatMensaje = chatRepository.save(chatMensaje);

        // Obtener username para el broadcast
        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        String username = usuario != null ? usuario.getUsername() : "Usuario";

        // Broadcast via WebSocket
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("id", chatMensaje.getId());
        payload.put("usuarioId", usuarioId);
        payload.put("username", username);
        payload.put("mensaje", mensaje);
        payload.put("timestamp", chatMensaje.getTimestamp().toString());
        messagingTemplate.convertAndSend("/topic/chat/" + spotId, (Object) payload);

        return chatMensaje;
    }

    /**
     * Obtener mensajes recientes de un spot
     */
    public List<Map<String, Object>> obtenerMensajes(Long spotId) {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        List<ChatMensaje> mensajes = chatRepository.findMensajesRecientesBySpot(spotId, cutoff);

        return mensajes.stream().map(m -> {
            Usuario usuario = usuarioRepository.findById(m.getUsuarioId()).orElse(null);
            Map<String, Object> mensaje = new java.util.HashMap<>();
            mensaje.put("id", m.getId());
            mensaje.put("usuarioId", m.getUsuarioId());
            mensaje.put("username", usuario != null ? usuario.getUsername() : "Usuario");
            mensaje.put("mensaje", m.getMensaje());
            mensaje.put("timestamp", m.getTimestamp().toString());
            return mensaje;
        }).collect(Collectors.toList());
    }

    /**
     * Verificar si un usuario puede chatear en un spot (esta cerca)
     */
    public boolean puedesChatear(Long spotId, Double latitud, Double longitud) {
        return validarDistancia(spotId, latitud, longitud);
    }

    /**
     * Tarea programada: eliminar mensajes viejos (mas de 2 horas)
     */
    @Scheduled(fixedRate = 600000) // Cada 10 minutos
    @Transactional
    public void limpiarMensajesViejos() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        chatRepository.eliminarMensajesViejos(cutoff);
    }
}
