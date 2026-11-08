package com.medallo_map.wheretosmoke.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * 🔧 CONFIGURACIÓN - Jackson ObjectMapper
 *
 * Provee el ObjectMapper de la app. Registra los módulos disponibles
 * (jsr310 para LocalDateTime, etc.) y serializa las fechas en ISO-8601.
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .findAndRegisterModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}
