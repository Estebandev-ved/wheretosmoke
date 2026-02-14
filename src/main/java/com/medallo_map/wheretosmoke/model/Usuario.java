package com.medallo_map.wheretosmoke.model;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MODELO DE USUARIO
 * 
 * Representa un usuario registrado en la aplicación.
 * Implementa UserDetails para integrarse con Spring Security.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "usuarios")
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "genero")
    private String genero; // hombre, mujer, inclusive

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "activo")
    @Builder.Default
    private boolean activo = true;

    // GAMIFICACIÓN
    @Column(name = "puntos")
    @Builder.Default
    private Integer puntos = 0;

    // BADGES (JSON array de badges ganados, ej: ["PIONERO", "CENTINELA"])
    @Column(name = "badges", length = 500)
    private String badges;

    // PUSH SUBSCRIPTION (JSON para Web Push)
    @Column(name = "push_subscription", length = 1000)
    private String pushSubscription;

    // ESTADÍSTICAS
    @Column(name = "spots_creados")
    @Builder.Default
    private Integer spotsCreados = 0;

    @Column(name = "reportes_hechos")
    @Builder.Default
    private Integer reportesHechos = 0;

    @Column(name = "comentarios_hechos")
    @Builder.Default
    private Integer comentariosHechos = 0;

    // --- IMPLEMENTACIÓN DE UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return activo;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }

    /**
     * ROLES DE USUARIO
     */
    public enum Role {
        USER, // Usuario normal - puede crear spots y votar
        ADMIN // Admin - puede eliminar spots, banear usuarios
    }
}
