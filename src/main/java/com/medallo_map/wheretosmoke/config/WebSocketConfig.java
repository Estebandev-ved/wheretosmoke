package com.medallo_map.wheretosmoke.config;

import java.security.Principal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.medallo_map.wheretosmoke.model.MiembroCirculo;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.MiembroCirculoRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;
import com.medallo_map.wheretosmoke.security.JwtService;

/**
 * 📡 CONFIGURACIÓN WEBSOCKET
 * 
 * Permite enviar alertas en tiempo real a todos los usuarios conectados.
 * Cuando alguien reporta "Tombo", todos los demás lo verán instantáneamente.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final MiembroCirculoRepository miembroRepository;
    private final UsuarioRepository usuarioRepository;

    private static final Pattern TOPIC_CIRCULO = Pattern.compile("^/topic/circulo/([^/]+)(/.*)?$");

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    public WebSocketConfig(@Lazy JwtService jwtService, @Lazy UserDetailsService userDetailsService,
            @Lazy MiembroCirculoRepository miembroRepository, @Lazy UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.miembroRepository = miembroRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /** Valida que el Principal sea miembro activo del circulo al que intenta suscribirse. */
    private void validarSuscripcion(String destino, Principal principal) {
        if (destino == null) {
            return;
        }
        Matcher m = TOPIC_CIRCULO.matcher(destino);
        if (!m.matches()) {
            return;
        }
        Long circuloId;
        try {
            circuloId = Long.valueOf(m.group(1));
        } catch (NumberFormatException e) {
            throw new MessagingException("Destino de circulo invalido");
        }
        Long usuarioId = null;
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            Object p = auth.getPrincipal();
            if (p instanceof Usuario u) {
                usuarioId = u.getId();
            } else if (p instanceof UserDetails ud) {
                usuarioId = usuarioRepository.findByUsername(ud.getUsername()).map(Usuario::getId).orElse(null);
            }
        }
        boolean miembro = usuarioId != null && miembroRepository
                .findByCirculoIdAndUsuarioId(circuloId, usuarioId)
                .map(MiembroCirculo::getActivo).orElse(false);
        if (!miembro) {
            throw new MessagingException("No eres miembro de este circulo");
        }
    }

    /**
     * 🔌 Configurar el broker de mensajes
     * 
     * /topic = Para mensajes broadcast (a todos)
     * /queue = Para mensajes privados (a un usuario)
     * /app = Prefijo para mensajes del cliente al servidor
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilitar broker para /topic (broadcast) y /queue (mensajes privados)
        config.enableSimpleBroker("/topic", "/queue");

        // Prefijo para mensajes del cliente al servidor
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * 📍 Registrar endpoints WebSocket
     * 
     * El cliente se conectará a /ws con SockJS como fallback
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
                .addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins.toArray(new String[0]))
                .withSockJS(); // Fallback para navegadores que no soportan WebSocket
    }

    /**
     * 🔒 Autenticación STOMP: el CONNECT debe traer "Authorization: Bearer <jwt>".
     * El Principal queda asociado a la sesión; cualquier otro frame sin Principal se rechaza.
     * El remitente de un mensaje siempre sale de este Principal, nunca del payload.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null || accessor.getCommand() == null) {
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                        throw new MessagingException("Token JWT requerido");
                    }
                    try {
                        String jwt = authHeader.substring(7);
                        String username = jwtService.extractUsername(jwt);
                        UserDetails user = userDetailsService.loadUserByUsername(username);
                        if (!jwtService.isTokenValid(jwt, user)) {
                            throw new MessagingException("Token JWT inválido");
                        }
                        accessor.setUser(new UsernamePasswordAuthenticationToken(
                                user, null, user.getAuthorities()));
                    } catch (MessagingException e) {
                        throw e;
                    } catch (Exception e) {
                        throw new MessagingException("Token JWT inválido");
                    }
                } else if (accessor.getUser() == null
                        && !StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                    throw new MessagingException("No autenticado");
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    validarSuscripcion(accessor.getDestination(), accessor.getUser());
                }
                return message;
            }
        });
    }
}
