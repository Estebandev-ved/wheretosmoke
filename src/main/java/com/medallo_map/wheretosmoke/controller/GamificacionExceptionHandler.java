package com.medallo_map.wheretosmoke.controller;

import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.medallo_map.wheretosmoke.exception.NegocioException;

/**
 * Errores claros en español para tienda y gamificación.
 * Limitado a esos controladores para no cambiar el comportamiento del resto de la API.
 * Cuerpo: {"error": "mensaje"}.
 */
@RestControllerAdvice(assignableTypes = { TiendaController.class, GamificacionController.class })
public class GamificacionExceptionHandler {

    @ExceptionHandler(NegocioException.class)
    public ResponseEntity<Map<String, String>> negocio(NegocioException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getMessage()));
    }

    /** Violación de unicidad: compra duplicada concurrente. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> integridad(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Ya tienes este artículo"));
    }
}
