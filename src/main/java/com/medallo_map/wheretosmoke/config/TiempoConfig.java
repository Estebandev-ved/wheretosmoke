package com.medallo_map.wheretosmoke.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Reloj único de la app en America/Bogota (rachas y reinicio de misiones). Inyectable y fácil de fijar en tests. */
@Configuration
public class TiempoConfig {

    public static final ZoneId ZONA = ZoneId.of("America/Bogota");

    @Bean
    public Clock clockBogota() {
        return Clock.system(ZONA);
    }
}
