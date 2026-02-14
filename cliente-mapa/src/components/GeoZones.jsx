import React, { useState, useEffect } from 'react';
import { Polygon } from 'react-leaflet';
import axios from 'axios';
import './geo-zones.css';

/**
 * 🗺️ GEO ZONES - Visualización de zonas geográficas
 * 
 * Muestra polígonos de zonas activas en el mapa
 */
const GeoZones = () => {
    const [zonas, setZonas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchZonasActivas();
    }, []);

    const fetchZonasActivas = async () => {
        try {
            const { data } = await axios.get('http://localhost:8081/api/geozonas/activas');
            setZonas(data);
            console.log('🗺️ Zonas activas cargadas:', data.length);
        } catch (error) {
            console.error('Error cargando zonas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || zonas.length === 0) {
        return null; // No mostrar nada mientras carga o si no hay zonas
    }

    return (
        <>
            {zonas.map(zona => {
                try {
                    // Parse GeoJSON polygon
                    const poligono = JSON.parse(zona.poligonoJson);
                    const coordinates = poligono.coordinates[0]; // First ring

                    // Convert [lng, lat] to [lat, lng] for Leaflet
                    const positions = coordinates.map(coord => [coord[1], coord[0]]);

                    return (
                        <Polygon
                            key={zona.id}
                            positions={positions}
                            pathOptions={{
                                color: zona.color || '#00C851',
                                fillColor: zona.color || '#00C851',
                                fillOpacity: 0.15,
                                weight: 2,
                                opacity: 0.8,
                                className: 'geo-zone-polygon'
                            }}
                            interactive={false}
                        />
                    );
                } catch (error) {
                    console.error(`Error renderizando zona ${zona.id}:`, error);
                    return null;
                }
            })}
        </>
    );
};

export default GeoZones;

