package com.medallo_map.wheretosmoke.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.security.JwtAuthenticationFilter;

import java.util.Arrays;

/**
 * ⚙️ CONFIGURACIÓN DE SEGURIDAD - Spring Boot 4.0 / Spring Security 7.0
 * 
 * Spring Boot auto-configura DaoAuthenticationProvider cuando detecta
 * UserDetailsService y PasswordEncoder como beans.
 */
@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UsuarioRepository usuarioRepository;

    public SecurityConfig(@Lazy JwtAuthenticationFilter jwtAuthFilter, UsuarioRepository usuarioRepository) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * 🔐 Configuración de seguridad
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // 🌐 ENDPOINTS PÚBLICOS
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/spots").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/spots/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/spots").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/spots/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        // 📸 Nuevos endpoints de detalle
                        .requestMatchers(HttpMethod.GET, "/api/spots/*/detalle").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/spots/*/fotos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/spots/*/comentarios").permitAll()
                        // 🏆 Gamificación pública
                        .requestMatchers(HttpMethod.GET, "/api/gamificacion/leaderboard").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/gamificacion/badges").permitAll()
                        // 👑 ADMIN
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/spots/**").hasRole("ADMIN")
                        // Todo lo demás público por ahora
                        .anyRequest().permitAll())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * 🌐 Configuración de CORS
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Permitir localhost:5173 (Vite), localhost:3000 (React)
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173"));

        // Permitir TODOS los métodos HTTP incluyendo PATCH
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Permitir todos los headers (incluyendo Authorization)
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Exponer headers de respuesta
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization", "Content-Type"));

        // Permitir credenciales (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Cache de preflight
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    /**
     * 👤 UserDetailsService - Spring Security lo detecta automáticamente
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            // Intentar buscar por username primero
            return usuarioRepository.findByUsername(username)
                    .or(() -> usuarioRepository.findByEmail(username)) // Fallback: buscar por email
                    .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
        };
    }

    /**
     * 🔒 Password Encoder - Spring Security lo detecta automáticamente
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 🎛️ Authentication Manager - Usando AuthenticationConfiguration
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
