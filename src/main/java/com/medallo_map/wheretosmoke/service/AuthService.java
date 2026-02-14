package com.medallo_map.wheretosmoke.service;

import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.medallo_map.wheretosmoke.dto.AuthResponse;
import com.medallo_map.wheretosmoke.dto.LoginRequest;
import com.medallo_map.wheretosmoke.dto.RegisterRequest;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.model.Usuario.Role;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.security.JwtService;

import lombok.RequiredArgsConstructor;

/**
 * 🔐 SERVICIO DE AUTENTICACIÓN
 * 
 * Maneja el registro y login de usuarios.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

        private final UsuarioRepository usuarioRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        /**
         * 📝 REGISTRAR NUEVO USUARIO
         */
        public AuthResponse register(RegisterRequest request) {
                // Validar que el email no exista
                if (usuarioRepository.existsByEmail(request.getEmail())) {
                        return AuthResponse.builder()
                                        .message("❌ El email ya está registrado")
                                        .build();
                }

                // Validar que el username no exista
                if (usuarioRepository.existsByUsername(request.getUsername())) {
                        return AuthResponse.builder()
                                        .message("❌ El nombre de usuario ya existe")
                                        .build();
                }

                // Crear el usuario
                Usuario usuario = Usuario.builder()
                                .username(request.getUsername())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role(Role.USER) // Por defecto, rol USER
                                .createdAt(LocalDateTime.now())
                                .genero(request.getGenero() != null ? request.getGenero() : "hombre") // Guardar género
                                .activo(true)
                                .build();

                usuarioRepository.save(usuario);

                // Generar token JWT
                String token = jwtService.generateToken(usuario);

                return AuthResponse.builder()
                                .token(token)
                                .username(usuario.getUsername())
                                .email(usuario.getEmail())
                                .role(usuario.getRole().name())
                                .genero(usuario.getGenero())
                                .message("✅ Usuario registrado exitosamente")
                                .build();
        }

        /**
         * 🔑 LOGIN DE USUARIO
         */
        public AuthResponse login(LoginRequest request) {
                try {
                        // Autenticar con Spring Security
                        authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        request.getEmail(),
                                                        request.getPassword()));

                        // Buscar usuario
                        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                                        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                        // Actualizar género si es null (Backfill para usuarios antiguos)
                        if (usuario.getGenero() == null) {
                                usuario.setGenero("hombre");
                        }

                        // Actualizar último login
                        usuario.setLastLogin(LocalDateTime.now());
                        usuarioRepository.save(usuario);

                        // Generar token JWT
                        String token = jwtService.generateToken(usuario);

                        return AuthResponse.builder()
                                        .token(token)
                                        .username(usuario.getUsername())
                                        .email(usuario.getEmail())
                                        .role(usuario.getRole().name())
                                        .genero(usuario.getGenero())
                                        .message("✅ Login exitoso")
                                        .build();

                } catch (Exception e) {
                        return AuthResponse.builder()
                                        .message("❌ Email o contraseña incorrectos")
                                        .build();
                }
        }
}
