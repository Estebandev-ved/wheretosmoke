package com.medallo_map.wheretosmoke.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.medallo_map.wheretosmoke.model.AccionMision;
import com.medallo_map.wheretosmoke.model.ArticuloTienda;
import com.medallo_map.wheretosmoke.model.CategoriaArticulo;
import com.medallo_map.wheretosmoke.model.Mision;
import com.medallo_map.wheretosmoke.model.RarezaArticulo;
import com.medallo_map.wheretosmoke.model.TipoMision;
import com.medallo_map.wheretosmoke.repository.ArticuloTiendaRepository;
import com.medallo_map.wheretosmoke.repository.MisionRepository;

import lombok.RequiredArgsConstructor;

/**
 * Siembra idempotente del catálogo de misiones y de la tienda: solo inserta los
 * códigos que faltan, así que reiniciar no duplica ni pisa cambios hechos en BD.
 *
 * Imágenes: rutas a assets existentes de cliente-mapa. Las que empiezan por "/icons/"
 * están en public/icons (se sirven tal cual); las "src/assets/characters/" son assets
 * de Vite que el front debe importar/mapear por esa ruta.
 */
@Component
@RequiredArgsConstructor
public class CatalogoGamificacionInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CatalogoGamificacionInitializer.class);

    private final MisionRepository misionRepository;
    private final ArticuloTiendaRepository articuloRepository;

    @Override
    public void run(String... args) {
        sembrarMisiones();
        sembrarArticulos();
    }

    private void sembrarMisiones() {
        // Diarias
        mision("DIA_VOTAR_3", "Ojo de águila", "Vota en 3 spots (tombo o relax)", TipoMision.DIARIA,
                AccionMision.VOTAR_SPOT, 3, 10, 5);
        mision("DIA_FOTO_1", "Click paisa", "Sube 1 foto a un spot", TipoMision.DIARIA,
                AccionMision.SUBIR_FOTO, 1, 15, 8);
        mision("DIA_COMENTAR_2", "Buena charla", "Deja 2 comentarios", TipoMision.DIARIA,
                AccionMision.COMENTAR, 2, 10, 5);
        mision("DIA_CHECKIN", "Presente, parcero", "Haz tu check-in diario", TipoMision.DIARIA,
                AccionMision.CHECKIN, 1, 5, 3);
        // Semanales
        mision("SEM_VOTAR_15", "Vigía del parche", "Vota en 15 spots esta semana", TipoMision.SEMANAL,
                AccionMision.VOTAR_SPOT, 15, 50, 25);
        mision("SEM_CALIFICAR_5", "Crítico de spots", "Califica 5 spots esta semana", TipoMision.SEMANAL,
                AccionMision.CALIFICAR, 5, 40, 20);
        mision("SEM_CREAR_SPOT_1", "Cartógrafo paisa", "Crea 1 spot nuevo esta semana", TipoMision.SEMANAL,
                AccionMision.CREAR_SPOT, 1, 60, 40);
    }

    private void mision(String codigo, String titulo, String descripcion, TipoMision tipo, AccionMision accion,
            int meta, int xp, int monedas) {
        if (misionRepository.existsByCodigo(codigo)) {
            return;
        }
        misionRepository.save(Mision.builder().codigo(codigo).titulo(titulo).descripcion(descripcion)
                .tipo(tipo).accion(accion).meta(meta).recompensaXp(xp).recompensaMonedas(monedas)
                .activa(true).build());
        log.info("Misión sembrada: {}", codigo);
    }

    private void sembrarArticulos() {
        String ico = "/icons/";
        String chr = "src/assets/characters/";
        // SKIN (personajes)
        articulo("SKIN_PARCERO", "Parcero", "El clásico de la calle", CategoriaArticulo.SKIN, RarezaArticulo.COMUN, 60, 1, ico + "Hombre/Hombre.png", false);
        articulo("SKIN_PARCERA", "Parcera", "Con toda la actitud paisa", CategoriaArticulo.SKIN, RarezaArticulo.COMUN, 60, 1, ico + "Mujer/Mujer.png", false);
        articulo("SKIN_ELLE", "Elle", "Estilo sin etiquetas", CategoriaArticulo.SKIN, RarezaArticulo.COMUN, 60, 1, ico + "Inclusive/elle.png", false);
        articulo("SKIN_HIPPIE", "Hippie del Poblado", "Paz, amor y buen parche", CategoriaArticulo.SKIN, RarezaArticulo.RARO, 150, 2, chr + "hippie_guy.png", true);
        articulo("SKIN_ARCOIRIS", "Parcero Arcoíris", "Colores para todo el valle", CategoriaArticulo.SKIN, RarezaArticulo.EPICO, 400, 5, chr + "rainbow_guy.png", true);
        // MASCOTA (Bud)
        articulo("MASCOTA_BUD_MAPA", "Bud explorador", "Bud con su mapa a todas partes", CategoriaArticulo.MASCOTA, RarezaArticulo.COMUN, 80, 1, ico + "bud_map.png", false);
        articulo("MASCOTA_BUD_RELAX", "Bud relajado", "Bud en modo tranquilo", CategoriaArticulo.MASCOTA, RarezaArticulo.RARO, 200, 3, ico + "bud_smoking.png", false);
        articulo("MASCOTA_BUD_FURIA", "Bud furioso", "Cuando se pasa de tombos", CategoriaArticulo.MASCOTA, RarezaArticulo.EPICO, 450, 6, ico + "bud_angry.png", false);
        articulo("MASCOTA_BUD_TOMBO", "Bud tombo", "El más temido del parche", CategoriaArticulo.MASCOTA, RarezaArticulo.LEGENDARIO, 1000, 10, ico + "bud_police.png", true);
        // PIN (marcadores del mapa)
        articulo("PIN_RELAX", "Pin relax", "Marcador de zona tranquila", CategoriaArticulo.PIN, RarezaArticulo.COMUN, 40, 1, ico + "relax_marker.png", false);
        articulo("PIN_TOMBO", "Pin alerta", "Marcador con aire de alerta", CategoriaArticulo.PIN, RarezaArticulo.RARO, 120, 2, ico + "tombo_marker.png", false);
        articulo("PIN_UBICACION", "Pin ubicación brillante", "Tu punto en el mapa, con estilo", CategoriaArticulo.PIN, RarezaArticulo.RARO, 180, 4, ico + "user_location.png", false);
        // MARCO y EFECTO
        articulo("MARCO_PAISA", "Marco paisa", "Marco de perfil con sabor local", CategoriaArticulo.MARCO, RarezaArticulo.COMUN, 70, 1, ico + "bud_map.png", false);
        articulo("MARCO_ARCOIRIS", "Marco arcoíris", "Para leyendas del mapa", CategoriaArticulo.MARCO, RarezaArticulo.LEGENDARIO, 1200, 12, chr + "rainbow_guy.png", false);
        articulo("EFECTO_HUMO", "Estela de humo", "Una nube te sigue al votar", CategoriaArticulo.EFECTO, RarezaArticulo.RARO, 250, 5, ico + "bud_smoking.png", false);
    }

    private void articulo(String codigo, String nombre, String descripcion, CategoriaArticulo categoria,
            RarezaArticulo rareza, int precio, int nivel, String imagen, boolean destacado) {
        if (articuloRepository.existsByCodigo(codigo)) {
            return;
        }
        articuloRepository.save(ArticuloTienda.builder().codigo(codigo).nombre(nombre).descripcion(descripcion)
                .categoria(categoria).rareza(rareza).precio(precio).nivelRequerido(nivel).imagen(imagen)
                .activo(true).destacado(destacado).build());
        log.info("Artículo sembrado: {}", codigo);
    }
}
