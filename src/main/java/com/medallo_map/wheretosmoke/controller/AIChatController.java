package com.medallo_map.wheretosmoke.controller;

import com.medallo_map.wheretosmoke.dto.ChatRequest;
import com.medallo_map.wheretosmoke.dto.ChatResponse;
import com.medallo_map.wheretosmoke.service.AzureOpenAIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/chat")
@CrossOrigin(origins = "*")
public class AIChatController {

    @Autowired
    private AzureOpenAIService azureOpenAIService;

    @Autowired
    private com.medallo_map.wheretosmoke.repository.UsuarioRepository usuarioRepository;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {

        com.medallo_map.wheretosmoke.model.Usuario usuario = null;
        if (userDetails != null) {
            usuario = usuarioRepository.findByUsername(userDetails.getUsername()).orElse(null);
        }

        String response = azureOpenAIService.getChatResponse(request.getMessage(), usuario, request.getLatitude(),
                request.getLongitude());
        return ResponseEntity.ok(new ChatResponse(response));
    }
}
