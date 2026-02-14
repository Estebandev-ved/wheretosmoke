package com.medallo_map.wheretosmoke.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medallo_map.wheretosmoke.model.Usuario;

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
}
