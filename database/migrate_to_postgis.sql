-- ========================================================
-- MIGRACION A POSTGIS PARA WHERETOSMOKE
-- ========================================================
-- Este script convierte las columnas latitud/longitud separadas
-- a un tipo POINT nativo de MySQL Spatial para mejor performance
-- en queries de proximidad geoespacial.
--
-- IMPORTANTE: Hacer backup de la base de datos antes de ejecutar
-- ========================================================

USE wheretosmoke_db;

-- Paso 1: Agregar nueva columna tipo POINT para coordenadas
-- Nota: En MariaDB el SRID se establece al insertar datos con ST_PointFromText
ALTER TABLE spots ADD COLUMN location POINT AFTER longitud;

-- Paso 2: Migrar datos existentes de latitud/longitud a la columna location
-- ST_PointFromText crea un objeto POINT a partir de coordenadas
-- El SRID 4326 se especifica aqui en la funcion, no en la columna
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
    AND longitud IS NOT NULL;

-- Paso 3: Crear indice espacial para optimizar queries de distancia
-- Esto mejora drasticamente el performance de busquedas por proximidad
CREATE SPATIAL INDEX idx_spot_location ON spots (location);

-- Paso 4: Eliminar las columnas antiguas (OPCIONAL - descomentar si estas seguro)
-- ALTER TABLE spots DROP COLUMN latitud;
-- ALTER TABLE spots DROP COLUMN longitud;

-- Verificacion: Contar cuantos spots se migraron correctamente
SELECT
    COUNT(*) as total_spots,
    COUNT(location) as spots_con_location,
    COUNT(latitud) as spots_con_latitud
FROM spots;

-- ========================================================
-- MIGRACION PARA TABLA REPORTES
-- ========================================================
-- Los reportes tambien necesitan location para el calculo
-- de rutas de bajo perfil (evitar zonas con reportes)
-- ========================================================

-- Paso 1: Agregar columna location a tabla reportes
-- Los nuevos reportes guardaran la ubicacion directamente desde el codigo Java
ALTER TABLE reportes ADD COLUMN location POINT AFTER userFingerprint;

-- Paso 2: Llenar la columna location usando las coordenadas del spot relacionado
UPDATE reportes r
INNER JOIN spots s ON r.spotId = s.id
SET
    r.location = s.location
WHERE
    s.location IS NOT NULL;

-- Paso 3: Crear indice espacial en reportes
CREATE SPATIAL INDEX idx_reporte_location ON reportes (location);

-- Verificacion final
SELECT 'Spots migrados:' as info, COUNT(*) as total, COUNT(location) as con_location
FROM spots
UNION ALL
SELECT 'Reportes migrados:' as info, COUNT(*) as total, COUNT(location) as con_location
FROM reportes;

-- ========================================================
-- QUERIES DE PRUEBA
-- ========================================================

-- Ejemplo 1: Buscar spots a menos de 1km de una coordenada
-- ST_Distance_Sphere calcula distancia en metros entre dos puntos
SELECT id, nombre, ST_Distance_Sphere(
        location, ST_PointFromText(
            'POINT(-75.5812 6.2442)', 4326
        )
    ) as distancia_metros
FROM spots
WHERE
    ST_Distance_Sphere(
        location,
        ST_PointFromText(
            'POINT(-75.5812 6.2442)',
            4326
        )
    ) <= 1000
ORDER BY distancia_metros;

-- Ejemplo 2: Obtener latitud y longitud desde el campo location
SELECT id, nombre, ST_X(location) as longitud, ST_Y(location) as latitud
FROM spots
WHERE
    location IS NOT NULL
LIMIT 5;