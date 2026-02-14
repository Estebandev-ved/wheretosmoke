package com.medallo_map.wheretosmoke.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.medallo_map.wheretosmoke.model.MiembroCirculo;

public interface MiembroCirculoRepository extends JpaRepository<MiembroCirculo, Long> {

        // Buscar miembros activos de un circulo
        List<MiembroCirculo> findByCirculoIdAndActivoTrue(Long circuloId);

        // Buscar circulos de un usuario
        List<MiembroCirculo> findByUsuarioIdAndActivoTrue(Long usuarioId);

        // Verificar si un usuario ya es miembro de un circulo
        Optional<MiembroCirculo> findByCirculoIdAndUsuarioId(Long circuloId, Long usuarioId);

        // Contar miembros activos de un circulo
        @Query("SELECT COUNT(m) FROM MiembroCirculo m WHERE m.circuloId = :circuloId AND m.activo = true")
        Long contarMiembrosActivos(@Param("circuloId") Long circuloId);

        // Activar compartir ubicacion para un miembro
        @Modifying
        @Query("UPDATE MiembroCirculo m SET m.compartiendoUbicacion = :estado " +
                        "WHERE m.circuloId = :circuloId AND m.usuarioId = :usuarioId")
        void actualizarEstadoCompartirUbicacion(@Param("circuloId") Long circuloId,
                        @Param("usuarioId") Long usuarioId,
                        @Param("estado") Boolean estado);
}
