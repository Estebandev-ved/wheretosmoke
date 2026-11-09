package com.medallo_map.wheretosmoke.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.MensajePrivado;

@Repository
public interface MensajePrivadoRepository extends JpaRepository<MensajePrivado, Long> {

    /** Mensajes de una conversación, del más nuevo al más viejo (la paginación pide limite+1). */
    @Query("SELECT m FROM MensajePrivado m WHERE m.usuarioMenor = :menor AND m.usuarioMayor = :mayor "
            + "ORDER BY m.id DESC")
    List<MensajePrivado> ultimos(@Param("menor") Long menor, @Param("mayor") Long mayor, Pageable pageable);

    /** Igual que {@link #ultimos} pero solo los anteriores al mensaje {@code antes}. */
    @Query("SELECT m FROM MensajePrivado m WHERE m.usuarioMenor = :menor AND m.usuarioMayor = :mayor "
            + "AND m.id < :antes ORDER BY m.id DESC")
    List<MensajePrivado> anteriores(@Param("menor") Long menor, @Param("mayor") Long mayor,
            @Param("antes") Long antes, Pageable pageable);

    /** Último mensaje de cada conversación en la que participa el usuario. */
    @Query("SELECT m FROM MensajePrivado m WHERE m.id IN (SELECT MAX(m2.id) FROM MensajePrivado m2 "
            + "WHERE m2.usuarioMenor = :u OR m2.usuarioMayor = :u GROUP BY m2.usuarioMenor, m2.usuarioMayor) "
            + "ORDER BY m.id DESC")
    List<MensajePrivado> ultimosPorConversacion(@Param("u") Long usuarioId);

    /** [remitenteId, no leídos] de lo que el usuario recibió de las personas indicadas. */
    @Query("SELECT m.deId, COUNT(m) FROM MensajePrivado m WHERE m.paraId = :u AND m.leido = false "
            + "AND m.deId IN :de GROUP BY m.deId")
    List<Object[]> noLeidosPorRemitente(@Param("u") Long usuarioId, @Param("de") Collection<Long> de);

    long countByParaIdAndLeidoFalseAndDeIdIn(Long paraId, Collection<Long> de);

    /** Marca como leídos (atómico) los mensajes que {@code para} recibió de {@code de}. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE MensajePrivado m SET m.leido = true WHERE m.paraId = :para AND m.deId = :de AND m.leido = false")
    int marcarLeidos(@Param("para") Long para, @Param("de") Long de);
}
