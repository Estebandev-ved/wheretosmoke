package com.medallo_map.wheretosmoke.config;

import java.security.SecureRandom;
import java.util.Random;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Fuente de azar inyectable para el cofre diario (en tests se reemplaza por una determinista). */
@Configuration
public class AleatorioConfig {

    @Bean
    public Random randomGamificacion() {
        return new SecureRandom();
    }
}
