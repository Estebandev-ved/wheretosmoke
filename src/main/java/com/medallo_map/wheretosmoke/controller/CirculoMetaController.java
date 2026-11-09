package com.medallo_map.wheretosmoke.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medallo_map.wheretosmoke.dto.MetaCirculoDTO;
import com.medallo_map.wheretosmoke.dto.ReclamoMetaDTO;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.service.CirculoMetaService;

import lombok.RequiredArgsConstructor;

/** Meta semanal cooperativa de un círculo (solo miembros activos). */
@RestController
@RequestMapping("/api/circulos/{id}/meta")
@RequiredArgsConstructor
public class CirculoMetaController {

    private final CirculoMetaService circuloMetaService;

    @GetMapping
    public ResponseEntity<MetaCirculoDTO> meta(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(circuloMetaService.obtener(id, requerir(usuario)));
    }

    @PostMapping("/reclamar")
    public ResponseEntity<ReclamoMetaDTO> reclamar(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(circuloMetaService.reclamar(id, requerir(usuario)));
    }

    private Long requerir(Usuario usuario) {
        if (usuario == null) {
            throw new NegocioException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión");
        }
        return usuario.getId();
    }
}
