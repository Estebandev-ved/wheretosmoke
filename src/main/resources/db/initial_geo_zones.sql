-- 🗺️ SCRIPT DE DATOS INICIALES - GEO ZONAS
-- Inserta zonas de prueba de Medellín para testing

-- ============================================
-- ZONA 1: EL POBLADO (ACTIVA)
-- ============================================
INSERT INTO
    geo_zonas (
        nombre,
        tipo,
        poligono_json,
        activa,
        color,
        descripcion,
        orden,
        fecha_creacion,
        total_spots
    )
VALUES (
        'El Poblado',
        'COMUNA',
        '{
      "type": "Polygon",
      "coordinates": [[
        [-75.5812, 6.2042],
        [-75.5812, 6.2350],
        [-75.5550, 6.2350],
        [-75.5550, 6.2042],
        [-75.5812, 6.2042]
      ]]
    }',
        true,
        '#00C851',
        'Zona premium de Medellín. Famosa por sus restaurantes, parques y vida nocturna.',
        1,
        NOW(),
        0
    );

-- ============================================
-- ZONA 2: LAURELES - ESTADIO (ACTIVA)
-- ============================================
INSERT INTO
    geo_zonas (
        nombre,
        tipo,
        poligono_json,
        activa,
        color,
        descripcion,
        orden,
        fecha_creacion,
        total_spots
    )
VALUES (
        'Laureles - Estadio',
        'COMUNA',
        '{
      "type": "Polygon",
      "coordinates": [[
        [-75.5950, 6.2400],
        [-75.5950, 6.2600],
        [-75.5680, 6.2600],
        [-75.5680, 6.2400],
        [-75.5950, 6.2400]
      ]]
    }',
        true,
        '#0099CC',
        'Zona central con el Estadio Atanasio Girardot y amplios parques.',
        2,
        NOW(),
        0
    );

-- ============================================
-- ZONA 3: LA CANDELARIA - CENTRO (INACTIVA)
-- ============================================
INSERT INTO
    geo_zonas (
        nombre,
        tipo,
        poligono_json,
        activa,
        color,
        descripcion,
        orden,
        fecha_creacion,
        total_spots
    )
VALUES (
        'La Candelaria',
        'COMUNA',
        '{
      "type": "Polygon",
      "coordinates": [[
        [-75.5750, 6.2450],
        [-75.5750, 6.2550],
        [-75.5600, 6.2550],
        [-75.5600, 6.2450],
        [-75.5750, 6.2450]
      ]]
    }',
        false,
        '#FF9800',
        'Centro histórico y comercial de Medellín. Próximamente disponible.',
        3,
        NOW(),
        0
    );

-- ============================================
-- ZONA 4: BELÉN (INACTIVA)
-- ============================================
INSERT INTO
    geo_zonas (
        nombre,
        tipo,
        poligono_json,
        activa,
        color,
        descripcion,
        orden,
        fecha_creacion,
        total_spots
    )
VALUES (
        'Belén',
        'COMUNA',
        '{
      "type": "Polygon",
      "coordinates": [[
        [-75.6100, 6.2200],
        [-75.6100, 6.2400],
        [-75.5850, 6.2400],
        [-75.5850, 6.2200],
        [-75.6100, 6.2200]
      ]]
    }',
        false,
        '#9C27B0',
        'Comuna occidental de Medellín. En expansión próximamente.',
        4,
        NOW(),
        0
    );

-- Verificar inserción
SELECT
    id,
    nombre,
    tipo,
    activa,
    color,
    orden
FROM geo_zonas
ORDER BY orden;