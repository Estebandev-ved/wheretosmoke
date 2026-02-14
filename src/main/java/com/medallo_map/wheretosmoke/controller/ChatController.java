package com.medallo_map.wheretosmoke.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medallo_map.wheretosmoke.model.ChatMensaje;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.service.ChatService;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Enviar mensaje al chat de un spot
     */
    @PostMapping("/{spotId}/mensaje")
    public ResponseEntity<?> enviarMensaje(
            @PathVariable Long spotId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String mensaje = (String) request.get("mensaje");
        Double latitud = ((Number) request.get("latitud")).doubleValue();
        Double longitud = ((Number) request.get("longitud")).doubleValue();

        try {
            ChatMensaje chatMensaje = chatService.enviarMensaje(spotId, usuario.getId(),
                    mensaje, latitud, longitud);

            return ResponseEntity.ok(Map.of(
                    "id", chatMensaje.getId(),
                    "mensaje", "Mensaje enviado"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener mensajes recientes de un spot
     */
    @GetMapping("/{spotId}/mensajes")
    public ResponseEntity<List<Map<String, Object>>> obtenerMensajes(@PathVariable Long spotId) {
        List<Map<String, Object>> mensajes = chatService.obtenerMensajes(spotId);
        return ResponseEntity.ok(mensajes);
    }

    /**
     * Verificar si puedes chatear en un spot (estas cerca)
     */
    @PostMapping("/{spotId}/verificar-distancia")
    public ResponseEntity<?> verificarDistancia(
            @PathVariable Long spotId,
            @RequestBody Map<String, Double> request) {

        Double latitud = request.get("latitud");
        Double longitud = request.get("longitud");

        boolean puedesChatear = chatService.puedesChatear(spotId, latitud, longitud);

        return ResponseEntity.ok(Map.of(
                "puedesChatear", puedesChatear,
                "mensaje", puedesChatear
                        ? "Estas cerca del spot"
                        : "Debes acercarte al spot (menos de 50m)"));
    }
}
