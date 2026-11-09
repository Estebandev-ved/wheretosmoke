package com.medallo_map.wheretosmoke.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.medallo_map.wheretosmoke.dto.SocialDTO.ActividadAmigo;
import com.medallo_map.wheretosmoke.dto.SocialDTO.PaginaPersonas;
import com.medallo_map.wheretosmoke.dto.SocialDTO.Privacidad;
import com.medallo_map.wheretosmoke.dto.SocialDTO.UsuarioMini;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.ActividadAmigosService;
import com.medallo_map.wheretosmoke.service.PersonasService;

import lombok.RequiredArgsConstructor;

/** Sugerencias de personas, descubrimiento, amigos en común, privacidad y actividad de amigos. Todo autenticado. */
@RestController
@RequiredArgsConstructor
public class PersonasController {

    private final PersonasService personasService;
    private final ActividadAmigosService actividadService;

    @GetMapping("/api/personas/sugeridas")
    public ResponseEntity<PaginaPersonas> sugeridas(@RequestParam(name = "pagina", required = false) Integer pagina,
            @RequestParam(name = "limite", required = false) Integer limite,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(personasService.sugeridas(requerir(usuario), pagina, limite));
    }

    @GetMapping("/api/personas/descubrir")
    public ResponseEntity<PaginaPersonas> descubrir(@RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "comuna", required = false) String comuna,
            @RequestParam(name = "orden", required = false) String orden,
            @RequestParam(name = "pagina", required = false) Integer pagina,
            @RequestParam(name = "limite", required = false) Integer limite,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(personasService.descubrir(requerir(usuario), q, comuna, orden, pagina, limite));
    }

    @GetMapping("/api/usuarios/{id}/amigos-en-comun")
    public ResponseEntity<List<UsuarioMini>> amigosEnComun(@PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(personasService.amigosEnComun(requerir(usuario), id));
    }

    @GetMapping("/api/usuarios/me/privacidad")
    public ResponseEntity<Privacidad> privacidad(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(personasService.privacidad(requerir(usuario)));
    }

    @PutMapping("/api/usuarios/me/privacidad")
    public ResponseEntity<Privacidad> actualizarPrivacidad(@RequestBody Privacidad body,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(personasService.actualizarPrivacidad(requerir(usuario), body));
    }

    @GetMapping("/api/amigos/actividad")
    public ResponseEntity<List<ActividadAmigo>> actividad(
            @RequestParam(name = "limite", required = false) Integer limite,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(actividadService.actividad(requerir(usuario), limite));
    }

    private Long requerir(Usuario usuario) {
        if (usuario == null) {
            throw new NegocioException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión");
        }
        return usuario.getId();
    }
}
