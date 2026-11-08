package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.TransaccionMonedas;
import com.medallo_map.wheretosmoke.repository.TransaccionMonedasRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * BILLETERA: único punto por el que se mueven monedas.
 *
 * - El saldo cambia con un UPDATE atómico (el "saldo >= monto" va dentro del SQL),
 *   por lo que nunca queda negativo ni siquiera con peticiones concurrentes.
 * - Cada movimiento deja una fila auditable en transacciones_monedas, en la misma
 *   transacción que el cambio de saldo (si algo falla, ambos se revierten).
 */
@Service
@RequiredArgsConstructor
public class MonedasService {

    private final UsuarioRepository usuarioRepository;
    private final TransaccionMonedasRepository transaccionRepository;
    private final Clock clock;

    /** Suma monedas al usuario. Devuelve el saldo resultante. */
    @Transactional
    public int acreditar(Long usuarioId, int monto, String motivo, String referencia) {
        if (monto <= 0) {
            throw new IllegalArgumentException("El monto a acreditar debe ser positivo");
        }
        if (usuarioRepository.sumarMonedas(usuarioId, monto) == 0) {
            throw new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        return registrar(usuarioId, monto, motivo, referencia);
    }

    /** Resta monedas. Lanza 402 si no alcanza el saldo; nunca deja el saldo negativo. */
    @Transactional
    public int debitar(Long usuarioId, int monto, String motivo, String referencia) {
        if (monto <= 0) {
            throw new IllegalArgumentException("El monto a debitar debe ser positivo");
        }
        if (usuarioRepository.restarMonedasSiAlcanza(usuarioId, monto) == 0) {
            throw new NegocioException(HttpStatus.PAYMENT_REQUIRED, "No tienes monedas suficientes");
        }
        return registrar(usuarioId, -monto, motivo, referencia);
    }

    private int registrar(Long usuarioId, int delta, String motivo, String referencia) {
        Integer saldo = usuarioRepository.obtenerMonedas(usuarioId);
        int saldoFinal = saldo == null ? 0 : saldo;
        transaccionRepository.save(TransaccionMonedas.builder()
                .usuarioId(usuarioId)
                .delta(delta)
                .saldoResultante(saldoFinal)
                .motivo(motivo)
                .referencia(referencia)
                .fecha(LocalDateTime.now(clock))
                .build());
        return saldoFinal;
    }
}
