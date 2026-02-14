package com.medallo_map.wheretosmoke.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 🔧 CONFIGURACIÓN - Jackson ObjectMapper
 * 
 * Provee el bean ObjectMapper para JSON parsing
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
