package com.medallo_map.wheretosmoke.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTOs de la capa social (perfil público, amigos, bloqueos y mensajes privados).
 * Solo exponen datos públicos: nunca email, monedas, ubicación ni historial de visitas.
 */
public final class SocialDTO {

    private SocialDTO() {
    }

    /** Persona en listas de solicitudes y conversaciones. */
    public record UsuarioMini(Long id, String username, int nivel, Map<String, String> equipados) {
    }

    /** Resultado de GET /api/usuarios/buscar. */
    public record UsuarioBusqueda(Long id, String username, int nivel, String tituloRango,
            Map<String, String> equipados, String estadoAmistad, int amigosEnComun) {
    }

    /** GET /api/usuarios/{id}/perfil. solicitudId es null salvo que haya una solicitud pendiente. */
    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record PerfilPublico(Long id, String username, int nivel, String tituloRango, int puntos,
            int rachaDias, Map<String, String> equipados, LocalDateTime miembroDesde, long spotsDescubiertos,
            long comunasCompletas, long totalAmigos, String estadoAmistad, Long solicitudId,
            boolean bloqueadoPorMi, long amigosEnComun) {
    }

    /** Respuesta de enviar/aceptar/rechazar/cancelar. estado: ENVIADA, AMIGOS, RECHAZADA o CANCELADA. */
    public record SolicitudResultado(Long solicitudId, String estado) {
    }

    public record SolicitudItem(Long solicitudId, UsuarioMini usuario, LocalDateTime fecha) {
    }

    public record Solicitudes(List<SolicitudItem> recibidas, List<SolicitudItem> enviadas) {
    }

    public record Amigo(Long id, String username, int nivel, String tituloRango, Map<String, String> equipados,
            LocalDateTime desde, long noLeidos) {
    }

    public record Bloqueado(Long id, String username) {
    }

    public record Conversacion(UsuarioMini usuario, String ultimoMensaje, LocalDateTime fecha, long noLeidos,
            boolean esMio) {
    }

    public record MensajeDTO(Long id, Long deId, Long paraId, String texto, LocalDateTime fecha, boolean leido) {
    }

    public record PaginaMensajes(List<MensajeDTO> mensajes, boolean hayMas) {
    }

    public record NoLeidos(long total) {
    }

    public record Marcados(int marcados) {
    }

    /** Persona sugerida o descubierta: razones legibles y puntaje explicable. */
    public record PersonaSugerida(Long id, String username, int nivel, String tituloRango,
            Map<String, String> equipados, String estadoAmistad, int amigosEnComun, List<String> razones,
            int puntaje) {
    }

    public record PaginaPersonas(List<PersonaSugerida> items, boolean hayMas) {
    }

    /** Ajustes de privacidad. En PUT, un campo null significa "no cambiar". */
    public record Privacidad(Boolean visibleEnSugerencias, String aceptaSolicitudes) {
    }

    /** tipo: SPOT_DESCUBIERTO | SELLO_COMUNA | FOTO. Sin ubicación exacta. */
    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record ActividadAmigo(UsuarioMini usuario, String tipo, String texto, LocalDateTime fecha, Long spotId) {
    }
}
