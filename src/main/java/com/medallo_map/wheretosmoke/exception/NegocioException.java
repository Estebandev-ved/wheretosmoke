package com.medallo_map.wheretosmoke.exception;

import org.springframework.http.HttpStatus;

/** Error de regla de negocio con código HTTP y mensaje en español para el cliente. */
public class NegocioException extends RuntimeException {

    private final HttpStatus status;

    public NegocioException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
