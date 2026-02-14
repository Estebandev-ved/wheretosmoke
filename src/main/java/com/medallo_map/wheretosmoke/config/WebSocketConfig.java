package com.medallo_map.wheretosmoke.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * 📡 CONFIGURACIÓN WEBSOCKET
 * 
 * Permite enviar alertas en tiempo real a todos los usuarios conectados.
 * Cuando alguien reporta "Tombo", todos los demás lo verán instantáneamente.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

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
                .setAllowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:3000",
                        "http://127.0.0.1:5173")
                .withSockJS(); // Fallback para navegadores que no soportan WebSocket
    }
}
