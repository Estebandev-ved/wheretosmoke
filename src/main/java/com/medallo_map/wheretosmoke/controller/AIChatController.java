package com.medallo_map.wheretosmoke.controller;

import com.medallo_map.wheretosmoke.dto.ChatRequest;
import com.medallo_map.wheretosmoke.dto.ChatResponse;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.service.AzureOpenAIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Chat con IA. Requiere sesión iniciada (ver SecurityConfig) y aplica un límite
 * de uso por usuario para evitar abuso y gasto descontrolado en Azure OpenAI.
 */
@RestController
@RequestMapping("/api/ai/chat")
public class AIChatController {

    private static final int MAX_MENSAJE_CHARS = 1000;
    private static final int MAX_PETICIONES_POR_VENTANA = 20;
    private static final long VENTANA_MS = 60L * 60 * 1000; // 1 hora

    private final Map<String, Deque<Long>> peticionesPorUsuario = new ConcurrentHashMap<>();

    @Autowired
    private AzureOpenAIService azureOpenAIService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String mensaje = request.getMessage();
        if (mensaje == null || mensaje.isBlank()) {
            return ResponseEntity.badRequest().body(new ChatResponse("El mensaje no puede estar vacío."));
        }
        if (mensaje.length() > MAX_MENSAJE_CHARS) {
            return ResponseEntity.badRequest()
                    .body(new ChatResponse("El mensaje es demasiado largo (máximo " + MAX_MENSAJE_CHARS + " caracteres)."));
        }

        if (!permitirPeticion(userDetails.getUsername())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ChatResponse("Llegaste al límite de mensajes por hora. Intenta más tarde."));
        }

        Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername()).orElse(null);
        String response = azureOpenAIService.getChatResponse(mensaje, usuario, request.getLatitude(),
                request.getLongitude());
        return ResponseEntity.ok(new ChatResponse(response));
    }

    /** Ventana deslizante en memoria: suficiente para una sola instancia. */
    private boolean permitirPeticion(String username) {
        long ahora = System.currentTimeMillis();
        Deque<Long> tiempos = peticionesPorUsuario.computeIfAbsent(username, k -> new ArrayDeque<>());
        synchronized (tiempos) {
            while (!tiempos.isEmpty() && ahora - tiempos.peekFirst() > VENTANA_MS) {
                tiempos.pollFirst();
            }
            if (tiempos.size() >= MAX_PETICIONES_POR_VENTANA) {
                return false;
            }
            tiempos.addLast(ahora);
            return true;
        }
    }
}
