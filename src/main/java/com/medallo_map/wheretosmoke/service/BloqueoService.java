package com.medallo_map.wheretosmoke.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medallo_map.wheretosmoke.dto.SocialDTO.Bloqueado;
import com.medallo_map.wheretosmoke.exception.NegocioException;
import com.medallo_map.wheretosmoke.model.Bloqueo;
import com.medallo_map.wheretosmoke.model.Usuario;
import com.medallo_map.wheretosmoke.repository.AmistadRepository;
import com.medallo_map.wheretosmoke.repository.BloqueoRepository;
import com.medallo_map.wheretosmoke.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * BLOQUEOS: bloquear rompe la amistad y las solicitudes pendientes e impide mensajes y búsqueda en ambos
 * sentidos. La persona bloqueada no recibe aviso alguno.
 */
@Service
@RequiredArgsConstructor
public class BloqueoService {

    private final BloqueoRepository bloqueoRepository;
    private final AmistadRepository amistadRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioResumenService resumen;
    private final Clock clock;

    /** Idempotente: bloquear a quien ya está bloqueado no hace nada. */
    @Transactional
    public void bloquear(Long yo, Long otroId) {
        if (yo.equals(otroId)) {
            throw new NegocioException(HttpStatus.BAD_REQUEST, "No puedes bloquearte a ti mismo");
        }
        if (!usuarioRepository.existsById(otroId)) {
            throw new NegocioException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        amistadRepository.borrarPar(AmistadService.menor(yo, otroId), AmistadService.mayor(yo, otroId));
        if (!bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(yo, otroId)) {
            bloqueoRepository.saveAndFlush(Bloqueo.builder().bloqueadorId(yo).bloqueadoId(otroId)
                    .fecha(LocalDateTime.now(clock)).build());
        }
    }

    /** Idempotente. */
    @Transactional
    public void desbloquear(Long yo, Long otroId) {
        bloqueoRepository.borrar(yo, otroId);
    }

    @Transactional(readOnly = true)
    public List<Bloqueado> listar(Long yo) {
        List<Bloqueo> filas = bloqueoRepository.findByBloqueadorIdOrderByFechaDesc(yo);
        Map<Long, Usuario> usuarios = resumen.usuarios(filas.stream().map(Bloqueo::getBloqueadoId).toList());
        return filas.stream()
                .filter(b -> usuarios.containsKey(b.getBloqueadoId()))
                .map(b -> new Bloqueado(b.getBloqueadoId(), usuarios.get(b.getBloqueadoId()).getUsername()))
                .toList();
    }
}
