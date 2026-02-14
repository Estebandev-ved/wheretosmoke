import React from 'react';
import { useMap } from 'react-leaflet';
import './location-button.css';

/**
 * 📍 BOTÓN DE MI UBICACIÓN
 * 
 * Botón flotante que centra el mapa en la ubicación actual del usuario
 */
const LocationButton = ({ userLocation, setUserLocation }) => {
    const map = useMap();

    const handleLocationClick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = [position.coords.latitude, position.coords.longitude];
                    setUserLocation(coords);
                    map.flyTo(coords, 16, {
                        duration: 1.5
                    });
                },
                (error) => {
                    console.error('Error obteniendo ubicación:', error);
                    alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
                }
            );
        } else {
            alert('Tu navegador no soporta geolocalización');
        }
    };

    return (
        <button
            className="location-button"
            onClick={handleLocationClick}
            title="Ir a mi ubicación"
        >
            <img
                src="/icons/user_location.png"
                alt="Mi ubicación"
                className="location-icon"
            />
        </button>
    );
};

export default LocationButton;
