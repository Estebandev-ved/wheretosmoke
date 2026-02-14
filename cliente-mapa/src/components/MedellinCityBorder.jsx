import React, { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';

/**
 * 🏙️ MEDELLÍN CITY BORDER - Límite Real de la Ciudad
 * 
 * Carga el límite administrativo exacto desde archivo GeoJSON
 */

const MedellinCityBorder = () => {
    const [boundaryData, setBoundaryData] = useState(null);

    useEffect(() => {
        // Cargar GeoJSON desde archivo público
        fetch('/data/medellin-boundary.json')
            .then(response => response.json())
            .then(data => {
                console.log('🗺️ Límite de Medellín cargado:', data);
                setBoundaryData(data);
            })
            .catch(error => {
                console.error('Error cargando límite de Medellín:', error);
            });
    }, []);

    if (!boundaryData) {
        return null;
    }

    return (
        <GeoJSON
            data={boundaryData}
            style={{
                color: '#E53935',       // Rojo Google Maps
                weight: 3,              // Grosor
                opacity: 0.7,          // Opacidad línea
                fillOpacity: 0,         // Sin relleno
                dashArray: '8, 12',     // Punteado
                lineCap: 'round',
                lineJoin: 'round'
            }}
            interactive={false}
        />
    );
};

export default MedellinCityBorder;
