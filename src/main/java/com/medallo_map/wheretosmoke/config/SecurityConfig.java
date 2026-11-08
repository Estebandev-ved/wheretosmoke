package com.medallo_map.wheretosmoke.config;

import org.springframework.beans.factory.annotation.Value;
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
import java.util.List;

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

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

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
                        // 🌐 Públicos: autenticación, WebSocket y lectura de datos del mapa
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        // Página de errores de Spring: sin esto un 500 se ve como 403
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/spots/**").permitAll()
                        // Votos anónimos por fingerprint (tombo / relax)
                        .requestMatchers(HttpMethod.POST, "/api/spots/*/tombo", "/api/spots/*/relax").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/geozonas/activas", "/api/rutas/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/geozonas/validar").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/gamificacion/leaderboard",
                                "/api/gamificacion/badges").permitAll()
                        // Catálogo de la tienda público (con flags de usuario si envía token)
                        .requestMatchers(HttpMethod.GET, "/api/tienda/articulos").permitAll()
                        // 👑 Solo ADMIN
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/push/broadcast").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/spots/**").hasRole("ADMIN")
                        // 🔒 Todo lo demás requiere sesión iniciada
                        .anyRequest().authenticated())
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

        // Orígenes configurables vía app.cors.allowed-origins
        configuration.setAllowedOrigins(allowedOrigins);

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
