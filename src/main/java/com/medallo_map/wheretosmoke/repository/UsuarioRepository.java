package com.medallo_map.wheretosmoke.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Usuario;

import jakarta.persistence.LockModeType;

/**
 * REPOSITORIO DE USUARIOS
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Buscar usuario por email
     */
    Optional<Usuario> findByEmail(String email);

    /**
     * Buscar usuario por username
     */
    Optional<Usuario> findByUsername(String username);

    /**
     * Verificar si existe un email
     */
    boolean existsByEmail(String email);

    /**
     * Verificar si existe un username
     */
    boolean existsByUsername(String username);

    /**
     * Búsqueda pública por nombre: {@code contiene} y {@code prefijo} son patrones LIKE en minúsculas con
     * los comodines del usuario ya escapados con '!' (ver BusquedaUsuarios). Excluye al propio usuario, cuentas
     * inactivas y personas bloqueadas en cualquier sentido. Los que empiezan por el texto salen primero.
     */
    @Query("SELECT u FROM Usuario u WHERE u.id <> :yo AND u.activo = true "
            + "AND LOWER(u.username) LIKE :contiene ESCAPE '!' "
            + "AND u.id NOT IN (SELECT b.bloqueadoId FROM Bloqueo b WHERE b.bloqueadorId = :yo) "
            + "AND u.id NOT IN (SELECT b2.bloqueadorId FROM Bloqueo b2 WHERE b2.bloqueadoId = :yo) "
            + "ORDER BY CASE WHEN LOWER(u.username) LIKE :prefijo ESCAPE '!' THEN 0 ELSE 1 END, u.username")
    java.util.List<Usuario> buscarPorNombre(@Param("yo") Long yo, @Param("contiene") String contiene,
            @Param("prefijo") String prefijo, org.springframework.data.domain.Pageable pageable);

    // ── Gamificación: operaciones atómicas (nunca read-modify-write en Java) ──

    /** Carga el usuario con bloqueo de escritura (serializa equipar/desequipar). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM Usuario u WHERE u.id = :id")
    Optional<Usuario> findByIdForUpdate(@Param("id") Long id);

    /** Suma monedas. Devuelve filas afectadas (0 = usuario inexistente). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE usuarios SET monedas = COALESCE(monedas, 0) + :monto WHERE id = :id", nativeQuery = true)
    int sumarMonedas(@Param("id") Long id, @Param("monto") int monto);

    /**
     * Resta monedas SOLO si alcanza el saldo (condición dentro del UPDATE, así
     * dos compras simultáneas no pueden dejar el saldo negativo).
     * Devuelve 0 si no hay saldo suficiente.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE usuarios SET monedas = monedas - :monto WHERE id = :id AND COALESCE(monedas, 0) >= :monto", nativeQuery = true)
    int restarMonedasSiAlcanza(@Param("id") Long id, @Param("monto") int monto);

    /** Marca el cofre de hoy como abierto solo si aún no se abrió (idempotencia por día). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE usuarios SET ultimo_cofre = :hoy "
            + "WHERE id = :id AND (ultimo_cofre IS NULL OR ultimo_cofre < :hoy)", nativeQuery = true)
    int registrarCofre(@Param("id") Long id, @Param("hoy") LocalDate hoy);

    @Query(value = "SELECT COALESCE(monedas, 0) FROM usuarios WHERE id = :id", nativeQuery = true)
    Integer obtenerMonedas(@Param("id") Long id);

    /** Suma XP (columna puntos) de forma atómica. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE usuarios SET puntos = COALESCE(puntos, 0) + :xp WHERE id = :id", nativeQuery = true)
    int sumarXp(@Param("id") Long id, @Param("xp") int xp);

    /**
     * Registra el check-in del día solo si aún no se hizo hoy (idempotencia por día).
     * Devuelve 0 si ya existía un check-in con fecha >= hoy.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE usuarios SET racha_dias = :racha, ultima_actividad = :hoy "
            + "WHERE id = :id AND (ultima_actividad IS NULL OR ultima_actividad < :hoy)", nativeQuery = true)
    int registrarCheckin(@Param("id") Long id, @Param("racha") int racha, @Param("hoy") LocalDate hoy);
}
