package com.medallo_map.wheretosmoke.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medallo_map.wheretosmoke.dto.ReaccionFotoDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.ReaccionFotoService;

import lombok.RequiredArgsConstructor;

/** Reacciones con emoji a fotos (los likes siguen en FotoFeedController). */
@RestController
@RequestMapping("/api/fotos")
@RequiredArgsConstructor
public class FotoReaccionController {

    private final ReaccionFotoService reaccionFotoService;

    /** POST /api/fotos/{id}/reaccion {"emoji": "..."} - cambiar reemplaza, repetir quita. */
    @PostMapping("/{id}/reaccion")
    public ResponseEntity<ReaccionFotoDTO> reaccionar(@PathVariable Long id, @RequestBody ReaccionRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            throw new NegocioException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión");
        }
        return ResponseEntity.ok(reaccionFotoService.reaccionar(id, usuario.getId(),
                request == null ? null : request.getEmoji()));
    }

    @lombok.Data
    public static class ReaccionRequest {
        private String emoji;
    }
}
