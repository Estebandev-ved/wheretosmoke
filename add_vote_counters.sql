-- ============================================
--  MIGRACIÓN: AGREGAR CONTADORES DE VOTOS
-- ============================================
-- Instrucciones:
-- 1. Asegúrate de estar en la base de datos "wheretosmoke"
-- 2. Copia TODO este código
-- 3. Pégalo en phpMyAdmin y ejecuta

-- 1️⃣ Agregar columnas de contadores de votos
ALTER TABLE spots
ADD COLUMN votos_tombo INT NOT NULL DEFAULT 0 AFTER cantidad_comentarios,
ADD COLUMN votos_relax INT NOT NULL DEFAULT 0 AFTER votos_tombo;

-- 2️⃣ Inicializar contadores para spots existentes
-- Contar los votos de las últimas 2 horas para cada spot
UPDATE spots s
SET
    votos_tombo = (
        SELECT COUNT(*)
        FROM reportes r
        WHERE
            r.spot_id = s.id
            AND r.tipo_reporte = 'TOMBO'
            AND r.timestamp > DATE_SUB(NOW(), INTERVAL 2 HOUR)
    ),
    votos_relax = (
        SELECT COUNT(*)
        FROM reportes r
        WHERE
            r.spot_id = s.id
            AND r.tipo_reporte = 'RELAX'
            AND r.timestamp > DATE_SUB(NOW(), INTERVAL 2 HOUR)
    );

-- 3️⃣ Verificar resultados
SELECT
    id,
    nombre,
    votos_tombo,
    votos_relax,
    estado
FROM spots
ORDER BY (votos_tombo + votos_relax) DESC
LIMIT 10;

-- ✅ Migración completada