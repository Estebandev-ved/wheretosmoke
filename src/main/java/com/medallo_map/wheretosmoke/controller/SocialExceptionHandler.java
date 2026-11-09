package com.medallo_map.wheretosmoke.controller;

import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.medallo_map.wheretosmoke.exception.NegocioException;

/** Errores {"error": "mensaje"} para perfil público, amigos, bloqueos y mensajes privados. */
@RestControllerAdvice(assignableTypes = { SocialController.class })
public class SocialExceptionHandler {

    @ExceptionHandler(NegocioException.class)
    public ResponseEntity<Map<String, String>> negocio(NegocioException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getMessage()));
    }

    /** Dos peticiones simultáneas chocaron en un índice único (par de amistad o bloqueo): se puede reintentar. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> integridad(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Operación simultánea, inténtalo de nuevo"));
    }

    @ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class })
    public ResponseEntity<Map<String, String>> peticionInvalida(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", "Petición inválida"));
    }
}
