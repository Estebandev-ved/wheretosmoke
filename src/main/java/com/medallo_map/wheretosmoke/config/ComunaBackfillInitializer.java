package com.medallo_map.wheretosmoke.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.medallo_map.wheretosmoke.model.Spot;
import com.medallo_map.wheretosmoke.repository.SpotRepository;
import com.medallo_map.wheretosmoke.service.ComunasMedellin;

import lombok.RequiredArgsConstructor;

/**
 * Backfill idempotente: asigna comuna a los spots existentes que aún no tienen.
 * Reiniciar no repite trabajo (solo toca spots con comuna nula). Un fallo no impide arrancar.
 */
@Component
@RequiredArgsConstructor
public class ComunaBackfillInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ComunaBackfillInitializer.class);

    private final SpotRepository spotRepository;

    @Override
    public void run(String... args) {
        try {
            List<Spot> pendientes = spotRepository.findByComunaIsNull();
            int asignados = 0;
            for (Spot spot : pendientes) {
                String comuna = ComunasMedellin.asignar(spot.getLatitud(), spot.getLongitud());
                if (comuna != null) {
                    spot.setComuna(comuna);
                    spotRepository.save(spot);
                    asignados++;
                }
            }
            if (!pendientes.isEmpty()) {
                log.info("Comuna asignada a {} de {} spots sin comuna", asignados, pendientes.size());
            }
        } catch (RuntimeException e) {
            log.warn("No se pudo asignar comuna a los spots existentes: {}", e.getMessage());
        }
    }
}
