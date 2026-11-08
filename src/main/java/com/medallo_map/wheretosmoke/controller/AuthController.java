package com.medallo_map.wheretosmoke.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.medallo_map.wheretosmoke.dto.AuthResponse;
import com.medallo_map.wheretosmoke.dto.LoginRequest;
import com.medallo_map.wheretosmoke.dto.RegisterRequest;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.AuthService;

import lombok.RequiredArgsConstructor;

/**
 * 🔐 CONTROLADOR DE AUTENTICACIÓN
 * 
 * Endpoints para registro, login y verificación de usuario.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 📝 POST /api/auth/register
     * Registrar nuevo usuario
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);

        if (response.getToken() == null) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 🔑 POST /api/auth/login
     * Login de usuario
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);

        if (response.getToken() == null) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 👤 GET /api/auth/me
     * Obtener información del usuario actual (requiere token)
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.ok(AuthResponse.builder()
                    .message("No autenticado")
                    .build());
        }

        return ResponseEntity.ok(AuthResponse.builder()
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .role(usuario.getRole().name())
                .genero(usuario.getGenero())
                .message("✅ Usuario autenticado")
                .build());
    }

    /**
     * 🔍 GET /api/auth/verify
     * Verificar si el token es válido
     */
    @GetMapping("/verify")
    public ResponseEntity<AuthResponse> verifyToken(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.ok(AuthResponse.builder()
                    .message("❌ Token inválido")
                    .build());
        }

        return ResponseEntity.ok(AuthResponse.builder()
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .role(usuario.getRole().name())
                .genero(usuario.getGenero())
                .message("✅ Token válido")
                .build());
    }
}
