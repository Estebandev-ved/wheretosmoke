package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RELACIÓN DE AMISTAD ENTRE DOS USUARIOS (solicitud pendiente o amistad aceptada).
 *
 * Una sola fila por PAR: (usuario_menor, usuario_mayor) con menor < mayor y restricción única. Así dos
 * solicitudes cruzadas simultáneas (A->B y B->A) o un doble clic chocan en la base de datos y nunca
 * quedan filas duplicadas. {@code solicitanteId} dice quién envió la solicitud (el otro es el destinatario).
 * Rechazar o cancelar borra la fila; aceptar la pasa a ACEPTADA.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "amistades", uniqueConstraints = @UniqueConstraint(name = "uk_amistad_par", columnNames = {
        "usuario_menor", "usuario_mayor" }), indexes = {
                @Index(name = "idx_amistad_mayor", columnList = "usuario_mayor"),
                @Index(name = "idx_amistad_solicitante", columnList = "solicitante_id, estado") })
public class Amistad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_menor", nullable = false)
    private Long usuarioMenor;

    @Column(name = "usuario_mayor", nullable = false)
    private Long usuarioMayor;

    @Column(name = "solicitante_id", nullable = false)
    private Long solicitanteId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private EstadoAmistad estado;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDateTime fechaSolicitud;

    @Column(name = "fecha_amistad")
    private LocalDateTime fechaAmistad;

    /** El otro miembro del par respecto a {@code usuarioId}. */
    public Long otroDe(Long usuarioId) {
        return usuarioId.equals(usuarioMenor) ? usuarioMayor : usuarioMenor;
    }

    /** Quien recibió la solicitud (el que no la envió). */
    public Long destinatarioId() {
        return otroDe(solicitanteId);
    }
}
