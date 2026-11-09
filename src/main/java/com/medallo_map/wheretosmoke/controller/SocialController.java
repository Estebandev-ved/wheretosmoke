package com.medallo_map.wheretosmoke.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.medallo_map.wheretosmoke.dto.SocialDTO.Amigo;
import com.medallo_map.wheretosmoke.dto.SocialDTO.Bloqueado;
import com.medallo_map.wheretosmoke.dto.SocialDTO.Conversacion;
import com.medallo_map.wheretosmoke.dto.SocialDTO.MensajeDTO;
import com.medallo_map.wheretosmoke.dto.SocialDTO.Marcados;
import com.medallo_map.wheretosmoke.dto.SocialDTO.NoLeidos;
import com.medallo_map.wheretosmoke.dto.SocialDTO.PaginaMensajes;
import com.medallo_map.wheretosmoke.dto.SocialDTO.PerfilPublico;
import com.medallo_map.wheretosmoke.dto.SocialDTO.SolicitudResultado;
import com.medallo_map.wheretosmoke.dto.SocialDTO.Solicitudes;
import com.medallo_map.wheretosmoke.dto.SocialDTO.UsuarioBusqueda;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.AmistadService;
import com.medallo_map.wheretosmoke.service.BloqueoService;
import com.medallo_map.wheretosmoke.service.MensajePrivadoService;
import com.medallo_map.wheretosmoke.service.PerfilPublicoService;

import lombok.RequiredArgsConstructor;

/**
 * Perfil público, búsqueda, amigos, bloqueos y mensajes privados. Todo requiere sesión iniciada.
 * Errores de negocio: {"error": "mensaje"} (ver SocialExceptionHandler).
 */
@RestController
@RequiredArgsConstructor
public class SocialController {

    public record SolicitudRequest(Long usuarioId) {
    }

    public record MensajeRequest(String texto) {
    }

    private final PerfilPublicoService perfilService;
    private final AmistadService amistadService;
    private final BloqueoService bloqueoService;
    private final MensajePrivadoService mensajeService;

    // ── Usuarios: búsqueda, perfil y bloqueos ────────────────────────────────

    @GetMapping("/api/usuarios/buscar")
    public ResponseEntity<List<UsuarioBusqueda>> buscar(@RequestParam(name = "q", required = false) String q,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(perfilService.buscar(requerir(usuario), q));
    }

    @GetMapping("/api/usuarios/{id}/perfil")
    public ResponseEntity<PerfilPublico> perfil(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(perfilService.perfil(requerir(usuario), id));
    }

    @GetMapping("/api/usuarios/bloqueados")
    public ResponseEntity<List<Bloqueado>> bloqueados(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(bloqueoService.listar(requerir(usuario)));
    }

    @PostMapping("/api/usuarios/{id}/bloquear")
    public ResponseEntity<Void> bloquear(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        bloqueoService.bloquear(requerir(usuario), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/usuarios/{id}/bloquear")
    public ResponseEntity<Void> desbloquear(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        bloqueoService.desbloquear(requerir(usuario), id);
        return ResponseEntity.noContent().build();
    }

    // ── Amigos ───────────────────────────────────────────────────────────────

    @PostMapping("/api/amigos/solicitudes")
    public ResponseEntity<SolicitudResultado> enviarSolicitud(@RequestBody SolicitudRequest body,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(amistadService.enviarSolicitud(requerir(usuario), body.usuarioId()));
    }

    @GetMapping("/api/amigos/solicitudes")
    public ResponseEntity<Solicitudes> solicitudes(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(amistadService.listarSolicitudes(requerir(usuario)));
    }

    @PostMapping("/api/amigos/solicitudes/{id}/aceptar")
    public ResponseEntity<SolicitudResultado> aceptar(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(amistadService.aceptar(requerir(usuario), id));
    }

    @PostMapping("/api/amigos/solicitudes/{id}/rechazar")
    public ResponseEntity<SolicitudResultado> rechazar(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(amistadService.rechazar(requerir(usuario), id));
    }

    @PostMapping("/api/amigos/solicitudes/{id}/cancelar")
    public ResponseEntity<SolicitudResultado> cancelar(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(amistadService.cancelar(requerir(usuario), id));
    }

    @GetMapping("/api/amigos")
    public ResponseEntity<List<Amigo>> amigos(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(amistadService.listarAmigos(requerir(usuario)));
    }

    @DeleteMapping("/api/amigos/{usuarioId}")
    public ResponseEntity<Void> eliminarAmigo(@PathVariable Long usuarioId, @AuthenticationPrincipal Usuario usuario) {
        amistadService.eliminarAmigo(requerir(usuario), usuarioId);
        return ResponseEntity.noContent().build();
    }

    // ── Mensajes privados ────────────────────────────────────────────────────

    @GetMapping("/api/mensajes/conversaciones")
    public ResponseEntity<List<Conversacion>> conversaciones(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(mensajeService.conversaciones(requerir(usuario)));
    }

    @GetMapping("/api/mensajes/no-leidos")
    public ResponseEntity<NoLeidos> noLeidos(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(new NoLeidos(mensajeService.totalNoLeidos(requerir(usuario))));
    }

    @GetMapping("/api/mensajes/{usuarioId}")
    public ResponseEntity<PaginaMensajes> mensajes(@PathVariable Long usuarioId,
            @RequestParam(name = "antes", required = false) Long antes,
            @RequestParam(name = "limite", required = false) Integer limite,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(mensajeService.listar(requerir(usuario), usuarioId, antes, limite));
    }

    @PostMapping("/api/mensajes/{usuarioId}")
    public ResponseEntity<MensajeDTO> enviarMensaje(@PathVariable Long usuarioId, @RequestBody MensajeRequest body,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(mensajeService.enviar(requerir(usuario), usuarioId, body.texto()));
    }

    @PostMapping("/api/mensajes/{usuarioId}/leido")
    public ResponseEntity<Marcados> marcarLeido(@PathVariable Long usuarioId,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(new Marcados(mensajeService.marcarLeidos(requerir(usuario), usuarioId)));
    }

    private Long requerir(Usuario usuario) {
        if (usuario == null) {
            throw new NegocioException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión");
        }
        return usuario.getId();
    }
}
