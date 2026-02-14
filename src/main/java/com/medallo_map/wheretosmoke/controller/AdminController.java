package com.medallo_map.wheretosmoke.controller;

import com.medallo_map.wheretosmoke.dto.*;
import com.medallo_map.wheretosmoke.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 🔒 ADMIN CONTROLLER - Panel de Administración
 * 
 * Todos los endpoints requieren Role.ADMIN
 * 
 * Endpoints:
 * - User Management
 * - Spot Moderation
 * - System Statistics
 * - Activity Logs
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // ===== GESTIÓN DE USUARIOS =====

    /**
     * 📋 GET - Obtener todos los usuarios
     * 
     * Requiere: ADMIN
     * Retorna: List<AdminUserDTO> con información completa de todos los usuarios
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminUserDTO>> getAllUsers() {
        List<AdminUserDTO> usuarios = adminService.getAllUsers();
        return ResponseEntity.ok(usuarios);
    }

    /**
     * 👤 GET - Obtener información detallada de un usuario
     * 
     * Requiere: ADMIN
     * Retorna: AdminUserDTO con toda la información del usuario
     */
    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDTO> getUserById(@PathVariable Long id) {
        AdminUserDTO usuario = adminService.getUserById(id);
        return ResponseEntity.ok(usuario);
    }

    /**
     * 🚫 POST - Banear/Desbanear usuario
     * 
     * Requiere: ADMIN
     * Acción: Soft delete - deshabilita la cuenta sin eliminar datos
     * Retorna: AdminUserDTO actualizado
     */
    @PostMapping("/users/{id}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDTO> toggleBanUser(@PathVariable Long id) {
        AdminUserDTO usuario = adminService.toggleBanUser(id);
        return ResponseEntity.ok(usuario);
    }

    /**
     * 🗑️ DELETE - Eliminar usuario permanentemente
     * 
     * Requiere: ADMIN
     * PELIGRO: Elimina el usuario y TODOS sus datos (spots, comentarios, favoritos)
     * Esta acción no se puede deshacer
     */
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUserPermanently(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 💀 DELETE - Eliminación HARD de usuario
     * 
     * Alias para /users/{id} DELETE con confirmación explícita
     */
    @DeleteMapping("/users/{id}/hard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> hardDeleteUser(@PathVariable Long id) {
        adminService.deleteUserPermanently(id);
        return ResponseEntity.noContent().build();
    }

    // ===== GESTIÓN DE SPOTS =====

    /**
     * 📍 GET - Obtener todos los spots
     * 
     * Requiere: ADMIN
     * Retorna: List<AdminSpotDTO> con información completa de todos los spots
     */
    @GetMapping("/spots")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminSpotDTO>> getAllSpots() {
        List<AdminSpotDTO> spots = adminService.getAllSpots();
        return ResponseEntity.ok(spots);
    }

    /**
     * 🗑️ DELETE - Eliminar spot
     * 
     * Requiere: ADMIN
     * Elimina el spot y todos sus datos relacionados (comentarios, fotos,
     * favoritos)
     */
    @DeleteMapping("/spots/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSpot(@PathVariable Long id) {
        adminService.deleteSpot(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 🚩 POST - Marcar/desmarcar spot como flaggeado
     * 
     * Requiere: ADMIN
     * Toggle del estado REPORTADO
     * Query param opcional: ?motivo=contenido inapropiado
     */
    @PostMapping("/spots/{id}/flag")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminSpotDTO> flagSpot(
            @PathVariable Long id,
            @RequestParam(required = false) String motivo) {
        AdminSpotDTO spot = adminService.flagSpot(id, motivo);
        return ResponseEntity.ok(spot);
    }

    /**
     * 🚨 GET - Obtener spots flaggeados/reportados
     * 
     * Requiere: ADMIN
     * Retorna: List<AdminSpotDTO> con spots marcados como REPORTADO
     */
    @GetMapping("/spots/flagged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminSpotDTO>> getFlaggedSpots() {
        List<AdminSpotDTO> spots = adminService.getFlaggedSpots();
        return ResponseEntity.ok(spots);
    }

    // ===== ESTADÍSTICAS =====

    /**
     * 📊 GET - Estadísticas generales del sistema
     * 
     * Requiere: ADMIN
     * Retorna: AdminStatsDTO con estadísticas completas
     * 
     * Incluye:
     * - Total de usuarios (activos, baneados, nuevos)
     * - Total de spots (activos, flaggeados, nuevos)
     * - Engagement (votos, comentarios, favoritos)
     * - Distribución por categoría
     * - Tendencias (registros/spots/votos por día)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsDTO> getSystemStats() {
        AdminStatsDTO stats = adminService.getSystemStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * 📊 GET - Estadísticas de usuarios
     * 
     * Alias para /stats filtrado por usuarios
     */
    @GetMapping("/stats/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsDTO> getUserStats() {
        // Se puede extender para retornar solo estadísticas de usuarios
        AdminStatsDTO stats = adminService.getSystemStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * 📊 GET - Estadísticas de spots
     * 
     * Alias para /stats filtrado por spots
     */
    @GetMapping("/stats/spots")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsDTO> getSpotStats() {
        // Se puede extender para retornar solo estadísticas de spots
        AdminStatsDTO stats = adminService.getSystemStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * 📊 GET - Estadísticas de engagement
     * 
     * Alias para /stats filtrado por engagement
     */
    @GetMapping("/stats/engagement")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsDTO> getEngagementStats() {
        // Se puede extender para retornar solo métricas de engagement
        AdminStatsDTO stats = adminService.getSystemStats();
        return ResponseEntity.ok(stats);
    }

    // ===== ACTIVIDAD =====

    /**
     * 📋 GET - Obtener actividad reciente del sistema
     * 
     * Requiere: ADMIN
     * Query param opcional: ?limit=50 (default: 100)
     * Retorna: List<AdminActivityDTO> con actividad reciente
     * 
     * Por ahora retorna lista vacía (TODO: implementar tabla de logs)
     */
    @GetMapping("/activity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminActivityDTO>> getRecentActivity(
            @RequestParam(defaultValue = "100") int limit) {
        List<AdminActivityDTO> actividad = adminService.getRecentActivity(limit);
        return ResponseEntity.ok(actividad);
    }

    /**
     * 📋 GET - Obtener actividad de un usuario específico
     * 
     * Requiere: ADMIN
     * Por ahora retorna lista vacía (TODO: implementar tabla de logs)
     */
    @GetMapping("/activity/user/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminActivityDTO>> getUserActivity(
            @PathVariable Long id,
            @RequestParam(defaultValue = "50") int limit) {
        // TODO: Implementar filtro por usuario
        List<AdminActivityDTO> actividad = adminService.getRecentActivity(limit);
        return ResponseEntity.ok(actividad);
    }

    // =====TEST ENDPOINT =====

    /**
     * ✅ GET - Test endpoint
     * 
     * Verifica que el usuario tiene permisos de admin
     */
    @GetMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("✅ Admin access granted! You have god-level permissions.");
    }
}
