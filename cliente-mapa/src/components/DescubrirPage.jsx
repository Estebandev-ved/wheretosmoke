import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiRocketLaunch, HiMapPin, HiStar, HiShieldExclamation, HiSparkles, HiMagnifyingGlass } from 'react-icons/hi2';
import RatingStars from './RatingStars';
import './feed-page.css'; // Reuses some feed-page styles

const API_URL = 'http://localhost:8081/api';

/**
 * 🔥 DESCUBRIR PAGE - Explorar spots
 * 
 * Página completa para explorar spots: cercanos, mejores y trending
 */
const DescubrirPage = ({ darkMode = false }) => {
    const [activeTab, setActiveTab] = useState('todos');
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            () => console.log('No location available')
        );
    }, []);

    useEffect(() => {
        cargarSpots();
    }, [activeTab]);

    const cargarSpots = async () => {
        setLoading(true);
        try {
            let endpoint = `${API_URL}/spots`;
            if (activeTab === 'cercanos' && userLocation) {
                endpoint = `${API_URL}/spots/cercanos?lat=${userLocation[0]}&lng=${userLocation[1]}&radius=10`;
            } else if (activeTab === 'mejores') {
                endpoint = `${API_URL}/spots/mejores`;
            } else if (activeTab === 'trending') {
                endpoint = `${API_URL}/spots/trending`;
            }

            const { data } = await axios.get(endpoint);
            setSpots(data);
        } catch (error) {
            console.error('Error cargando spots:', error);
            // Fallback
            try {
                const { data } = await axios.get(`${API_URL}/spots`);
                setSpots(data);
            } catch {
                setSpots([]);
            }
        }
        setLoading(false);
    };

    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const formatDistance = (lat, lng) => {
        if (!userLocation) return '';
        const dist = calcularDistancia(userLocation[0], userLocation[1], lat, lng);
        return dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
    };

    const tabs = [
        { key: 'todos', label: 'Todos', icon: <HiMapPin size={14} /> },
        { key: 'cercanos', label: 'Cerca', icon: <HiMapPin size={14} /> },
        { key: 'mejores', label: 'Mejores', icon: <HiStar size={14} /> },
        { key: 'trending', label: 'Trending', icon: <HiRocketLaunch size={14} /> },
    ];

    const tabStyle = (active) => ({
        padding: '10px 16px',
        border: 'none',
        borderRadius: '12px',
        backgroundColor: active
            ? (darkMode ? 'rgba(0,200,81,0.2)' : 'rgba(0,200,81,0.15)')
            : 'transparent',
        color: active ? '#00C851' : (darkMode ? '#888' : '#666'),
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: active ? '600' : '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
    });

    const spotCardStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px',
        background: darkMode ? 'rgba(25, 25, 25, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        borderRadius: '16px',
        marginBottom: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    };

    const spotIconStyle = (estado) => ({
        width: '50px',
        height: '50px',
        borderRadius: '14px',
        background: estado === 'ROJO'
            ? 'linear-gradient(135deg, rgba(255,68,68,0.2) 0%, rgba(255,68,68,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(0,200,81,0.2) 0%, rgba(0,200,81,0.1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    });

    return (
        <div className={`feed-page ${darkMode ? '' : 'light'}`}>
            {/* Header */}
            <div className="feed-header">
                <div>
                    <h1 className="feed-title">
                        <HiRocketLaunch size={28} />
                        Descubrir
                    </h1>
                    <p className="feed-subtitle">Explora los spots de Medellín</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                overflowX: 'auto',
                paddingBottom: '4px'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        style={tabStyle(activeTab === tab.key)}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="feed-loading">
                    <div className="feed-spinner"></div>
                    <span>Cargando spots...</span>
                </div>
            ) : spots.length > 0 ? (
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    {spots.map((spotDTO, i) => {
                        if (!spotDTO || !spotDTO.spot) return null;
                        const spot = spotDTO.spot;

                        return (
                            <div key={spot.id || i} style={spotCardStyle}>
                                <div style={spotIconStyle(spot.estado)}>
                                    {spot.estado === 'ROJO'
                                        ? <HiShieldExclamation size={24} color="#ff4444" />
                                        : <HiSparkles size={24} color="#00C851" />
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: '600',
                                        color: darkMode ? 'white' : '#333',
                                        fontSize: '15px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {spot.nombre}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginTop: '4px'
                                    }}>
                                        {userLocation && spot.latitud && spot.longitud && (
                                            <span style={{ fontSize: '12px', color: '#00C851', fontWeight: '500' }}>
                                                {formatDistance(spot.latitud, spot.longitud)}
                                            </span>
                                        )}
                                        <RatingStars
                                            rating={Math.round(spot.calificacionPromedio || 0)}
                                            size={12}
                                            darkMode={darkMode}
                                        />
                                    </div>
                                    {spot.descripcion && (
                                        <div style={{
                                            fontSize: '12px',
                                            color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                            marginTop: '4px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {spot.descripcion}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="feed-empty">
                    <div className="feed-empty-icon"><HiMagnifyingGlass size={48} /></div>
                    <div className="feed-empty-text">No hay spots disponibles</div>
                    <div className="feed-empty-hint">
                        ¡Crea el primer spot tocando el mapa!
                    </div>
                </div>
            )}
        </div>
    );
};

export default DescubrirPage;
