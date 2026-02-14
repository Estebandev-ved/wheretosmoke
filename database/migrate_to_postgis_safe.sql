-- ========================================================
-- MIGRACION A POSTGIS PARA WHERETOSMOKE (VERSION SEGURA)
-- ========================================================
-- Este script verifica si las columnas ya existen antes de crearlas
-- Esto evita errores de "columna duplicada"
-- ========================================================

USE wheretosmoke_db;

-- Paso 1: Verificar y agregar columna location a spots si no existe
SET @dbname = 'wheretosmoke_db';

SET @tablename = 'spots';

SET @columnname = 'location';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', -- La columna ya existe, no hacer nada
                'ALTER TABLE spots ADD COLUMN location POINT AFTER longitud'
            )
    );

PREPARE alterIfNotExists FROM @preparedStatement;

EXECUTE alterIfNotExists;

DEALLOCATE PREPARE alterIfNotExists;

-- Paso 2: Migrar datos existentes (solo los que no tienen location aun)
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

-- Paso 3: Crear indice espacial si no existe
SET
    @index_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            TABLE_SCHEMA = 'wheretosmoke_db'
            AND TABLE_NAME = 'spots'
            AND INDEX_NAME = 'idx_spot_location'
    );

SET
    @create_index = IF(
        @index_exists > 0,
        'SELECT 1', -- El indice ya existe
        'CREATE SPATIAL INDEX idx_spot_location ON spots (location)'
    );

PREPARE createIndexIfNotExists FROM @create_index;

EXECUTE createIndexIfNotExists;

DEALLOCATE PREPARE createIndexIfNotExists;

-- ========================================================
-- MIGRACION PARA TABLA REPORTES
-- ========================================================

-- Paso 4: Verificar y agregar columna location a reportes si no existe
SET @tablename = 'reportes';

SET
    @preparedStatement = (
        SELECT IF(
                (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = @dbname
                        AND TABLE_NAME = @tablename
                        AND COLUMN_NAME = @columnname
                ) > 0, 'SELECT 1', -- La columna ya existe
                'ALTER TABLE reportes ADD COLUMN location POINT AFTER userFingerprint'
            )
    );

PREPARE alterIfNotExists FROM @preparedStatement;

EXECUTE alterIfNotExists;

DEALLOCATE PREPARE alterIfNotExists;

-- Paso 5: Llenar la columna location usando coordenadas del spot
UPDATE reportes r
INNER JOIN spots s ON r.spotId = s.id
SET
    r.location = s.location
WHERE
    s.location IS NOT NULL
    AND r.location IS NULL;

-- Paso 6: Crear indice espacial en reportes si no existe
SET
    @index_exists = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            TABLE_SCHEMA = 'wheretosmoke_db'
            AND TABLE_NAME = 'reportes'
            AND INDEX_NAME = 'idx_reporte_location'
    );

SET
    @create_index = IF(
        @index_exists > 0,
        'SELECT 1',
        'CREATE SPATIAL INDEX idx_reporte_location ON reportes (location)'
    );

PREPARE createIndexIfNotExists FROM @create_index;

EXECUTE createIndexIfNotExists;

DEALLOCATE PREPARE createIndexIfNotExists;

-- Verificacion final
SELECT 'Spots migrados:' as info, COUNT(*) as total, COUNT(location) as con_location
FROM spots
UNION ALL
SELECT 'Reportes migrados:' as info, COUNT(*) as total, COUNT(location) as con_location
FROM reportes;

-- Verificar indices espaciales creados
SELECT
    TABLE_NAME,
    INDEX_NAME,
    INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE
    TABLE_SCHEMA = 'wheretosmoke_db'
    AND INDEX_TYPE = 'SPATIAL';