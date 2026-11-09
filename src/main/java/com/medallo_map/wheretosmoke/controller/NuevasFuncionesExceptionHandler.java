package com.medallo_map.wheretosmoke.controller;

import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.medallo_map.wheretosmoke.exception.NegocioException;

/** Errores {"error": "mensaje"} para metas de círculo, reacciones y ranking por comuna. */
@RestControllerAdvice(assignableTypes = { CirculoMetaController.class, FotoReaccionController.class,
        LeaderboardComunaController.class })
public class NuevasFuncionesExceptionHandler {

    @ExceptionHandler(NegocioException.class)
    public ResponseEntity<Map<String, String>> negocio(NegocioException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getMessage()));
    }

    /** Dos peticiones simultáneas chocaron en una restricción única: se puede reintentar. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> integridad(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Operación simultánea, inténtalo de nuevo"));
    }
}
