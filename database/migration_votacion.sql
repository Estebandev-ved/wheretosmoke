-- =====================================================
-- 🗂️ SCRIPT DE MIGRACIÓN - SISTEMA DE VOTACIÓN
-- WhereToSmoke - Base de Datos
-- =====================================================
-- Este script crea la tabla necesaria para el sistema de votación.
-- Ejecuta esto en tu base de datos MySQL antes de arrancar el backend.

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS wheretosmoke_db;

-- Seleccionar la base de datos
USE wheretosmoke_db;

-- =====================================================
-- 📊 TABLA: reportes
-- =====================================================
-- Almacena cada voto individual de los usuarios
-- Un spot puede tener múltiples reportes (votos)

CREATE TABLE IF NOT EXISTS reportes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

-- ID del spot al que pertenece este reporte
spot_id BIGINT NOT NULL,

-- Tipo de reporte: 'TOMBO' (policía) o 'RELAX' (seguro)
tipo_reporte VARCHAR(10) NOT NULL,

-- Identificador único del usuario que votó
-- Por ahora es un fingerprint del navegador
-- Después será el ID del usuario autenticado
user_fingerprint VARCHAR(255) NOT NULL,

-- Momento exacto del voto
timestamp DATETIME NOT NULL,

-- Índices para mejorar el rendimiento
INDEX idx_spot_id (spot_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_fingerprint (user_fingerprint)
);

-- =====================================================
-- ✅ VERIFICACIÓN
-- =====================================================
-- Consulta para verificar que la tabla se creó correctamente
DESCRIBE reportes;

-- =====================================================
-- 🧪 DATOS DE PRUEBA (OPCIONAL)
-- =====================================================
-- Solo ejecuta esto si quieres probar manualmente el sistema

-- Ejemplo: Insertar 3 votos TOMBO para el spot #1
/*
INSERT INTO reportes (spot_id, tipo_reporte, user_fingerprint, timestamp) VALUES
(1, 'TOMBO', 'test-user-1', NOW()),
(1, 'TOMBO', 'test-user-2', NOW()),
(1, 'TOMBO', 'test-user-3', NOW());
*/

-- Ejemplo: Verificar cuántos votos TOMBO tiene el spot #1
/*
SELECT COUNT(*) as total_votos_tombo
FROM reportes
WHERE spot_id = 1 
AND tipo_reporte = 'TOMBO'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 2 HOUR);
*/

-- =====================================================
-- 🧹 LIMPIEZA AUTOMÁTICA (OPCIONAL)
-- =====================================================
-- Puedes crear un evento programado que elimine reportes viejos

/*
CREATE EVENT IF NOT EXISTS limpiar_reportes_viejos
ON SCHEDULE EVERY 1 HOUR
DO
DELETE FROM reportes 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 2 HOUR);
*/

-- =====================================================
-- ℹ️ NOTAS IMPORTANTES
-- =====================================================
-- 1. Los reportes se consideran válidos por 2 horas
-- 2. Se necesitan 3 votos del mismo tipo para cambiar el estado
-- 3. Un usuario (fingerprint) solo puede votar una vez cada 2 horas por spot
-- 4. Spring JPA creará automáticamente la tabla si usas 'spring.jpa.hibernate.ddl-auto=update'
--    pero es mejor crearla manualmente para tener control total