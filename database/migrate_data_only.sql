-- ========================================================
-- MIGRACION SIMPLE - SOLO DATOS
-- ========================================================
-- Este script asume que las columnas location ya existen
-- (creadas por Hibernate) y solo migra los datos
-- ========================================================

USE wheretosmoke_db;

-- Migrar datos de spots
UPDATE spots
SET
    location = ST_PointFromText(
        CONCAT(
            'POINT(',
            longitud,
            ' ',
            latitud,
            ')'
        ),
        4326
    )
WHERE
    latitud IS NOT NULL
    AND longitud IS NOT NULL
    AND location IS NULL;

-- Migrar datos de reportes desde spots
-- Nota: spot_id es la columna en MySQL (Hibernate convierte spotId a spot_id)
UPDATE reportes r
INNER JOIN spots s ON r.spot_id = s.id
SET
    r.location = s.location
WHERE
    s.location IS NOT NULL
    AND r.location IS NULL;

-- Verificacion
SELECT
    'SPOTS:' as tabla,
    COUNT(*) as total,
    COUNT(location) as con_location,
    COUNT(*) - COUNT(location) as sin_location
FROM spots
UNION ALL
SELECT
    'REPORTES:' as tabla,
    COUNT(*) as total,
    COUNT(location) as con_location,
    COUNT(*) - COUNT(location) as sin_location
FROM reportes;