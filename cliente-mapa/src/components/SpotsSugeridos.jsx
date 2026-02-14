import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import RatingStars from './RatingStars';
import { HiMapPin, HiStar, HiRocketLaunch, HiShieldExclamation, HiSparkles, HiMagnifyingGlass, HiFire } from 'react-icons/hi2';

const API_URL = 'http://localhost:8081/api';

/**
 * 📍 SPOTS SUGERIDOS
 * 
 * Bottom sheet con tabs: Cercanos, Mejor calificados, Trending
 */
const SpotsSugeridos = ({
    isOpen = false,
    onClose = () => { },
    onSpotClick = () => { },
    userLocation = null,
    darkMode = false
}) => {
    const [activeTab, setActiveTab] = useState('cercanos');
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            cargarSpots();
        }
    }, [isOpen, activeTab]);

    const cargarSpots = async () => {
        setLoading(true);
        try {
            let endpoint = `${API_URL}/spots`;

            if (activeTab === 'cercanos' && userLocation) {
                endpoint = `${API_URL}/spots/cercanos?lat=${userLocation[0]}&lng=${userLocation[1]}&radius=5000`;
            } else if (activeTab === 'mejores') {
                endpoint = `${API_URL}/spots/mejores`;
            } else if (activeTab === 'trending') {
                endpoint = `${API_URL}/spots/trending`;
            }

            const { data } = await axios.get(endpoint);
            setSpots(data);
        } catch (error) {
            console.error('Error cargando spots:', error);

            // 🛡️ Fallback: Si falla el endpoint especializado, cargar todos los spots
            if (error.response?.status === 500 && activeTab !== 'todos') {
                try {
                    console.log('⚠️ Endpoint no disponible, cargando todos los spots...');
                    const { data } = await axios.get(`${API_URL}/spots`);
                    setSpots(data);
                } catch (fallbackError) {
                    console.error('❌ Error en fallback:', fallbackError);
                    setSpots([]); // Mostrar lista vacía si todo falla
                }
            } else {
                setSpots([]); // Mostrar lista vacía si hay error
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
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const formatDistance = (lat, lng) => {
        if (!userLocation) return '';
        const dist = calcularDistancia(userLocation[0], userLocation[1], lat, lng);
        if (dist < 1000) return `${Math.round(dist)}m`;
        return `${(dist / 1000).toFixed(1)}km`;
    };

    const isMobile = window.innerWidth <= 768;

    const styles = {
        overlay: {
            position: 'fixed',
            bottom: isMobile ? '60px' : 0,
            left: 0,
            right: 0,
            top: isOpen ? 0 : '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1500,
            display: 'flex',
            alignItems: 'flex-end',
            transition: 'top 0.3s ease'
        },
        sheet: {
            width: '100%',
            maxHeight: isMobile ? '60vh' : '70vh',
            backgroundColor: darkMode ? 'rgba(20, 20, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px 24px 0 0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        handle: {
            width: '40px',
            height: '4px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
            borderRadius: '2px',
            margin: '12px auto'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 20px 15px',
            borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        },
        title: {
            fontSize: '18px',
            fontWeight: '700',
            color: darkMode ? 'white' : '#333',
            margin: 0
        },
        closeBtn: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: darkMode ? '#888' : '#666',
            cursor: 'pointer'
        },
        tabs: {
            display: 'flex',
            padding: '10px 15px',
            gap: '8px'
        },
        tab: (active) => ({
            flex: 1,
            padding: '10px 12px',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: active
                ? (darkMode ? 'rgba(0,200,81,0.2)' : 'rgba(0,200,81,0.15)')
                : 'transparent',
            color: active
                ? '#00C851'
                : (darkMode ? '#888' : '#666'),
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: active ? '600' : '500',
            transition: 'all 0.2s'
        }),
        content: {
            flex: 1,
            overflowY: 'auto',
            padding: '15px'
        },
        spotCard: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px',
            background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: '16px',
            marginBottom: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        spotIcon: (estado) => ({
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: estado === 'ROJO'
                ? 'linear-gradient(135deg, rgba(255,68,68,0.2) 0%, rgba(255,68,68,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(0,200,81,0.2) 0%, rgba(0,200,81,0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px'
        }),
        spotInfo: {
            flex: 1,
            minWidth: 0
        },
        spotName: {
            fontWeight: '600',
            color: darkMode ? 'white' : '#333',
            fontSize: '15px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        spotMeta: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px'
        },
        spotDistance: {
            fontSize: '12px',
            color: '#00C851',
            fontWeight: '500'
        },
        spotRating: {
            fontSize: '12px',
            color: darkMode ? '#888' : '#666'
        },
        emptyState: {
            textAlign: 'center',
            padding: '40px 20px',
            color: darkMode ? '#666' : '#999'
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
                <div style={styles.handle}></div>

                <div style={styles.header}>
                    <h2 style={styles.title}><HiFire size={22} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Descubrir</h2>
                    <button style={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div style={styles.tabs}>
                    <button
                        style={styles.tab(activeTab === 'cercanos')}
                        onClick={() => setActiveTab('cercanos')}
                    >
                        <HiMapPin size={14} /> Cerca
                    </button>
                    <button
                        style={styles.tab(activeTab === 'mejores')}
                        onClick={() => setActiveTab('mejores')}
                    >
                        <HiStar size={14} /> Mejores
                    </button>
                    <button
                        style={styles.tab(activeTab === 'trending')}
                        onClick={() => setActiveTab('trending')}
                    >
                        <HiRocketLaunch size={14} /> Trending
                    </button>
                </div>

                <div style={styles.content}>
                    {loading ? (
                        <div style={styles.emptyState}>Cargando...</div>
                    ) : spots.length > 0 ? (
                        <div className="stagger-children">
                            {spots.map((spotDTO, i) => {
                                // 🛡️ El backend devuelve SpotDetalleDTO directamente (sin wrapper .spot)
                                if (!spotDTO) return null;
                                const spot = spotDTO.spot || spotDTO;

                                return (
                                    <div
                                        key={spot.id || i}
                                        style={styles.spotCard}
                                        onClick={() => onSpotClick(spot)}
                                    >
                                        <div style={styles.spotIcon(spot.estado)}>
                                            {spot.estado === 'ROJO' ? <HiShieldExclamation size={22} color="#ff4444" /> : <HiSparkles size={22} color="#00C851" />}
                                        </div>
                                        <div style={styles.spotInfo}>
                                            <div style={styles.spotName}>{spot.nombre}</div>
                                            <div style={styles.spotMeta}>
                                                {userLocation && (
                                                    <span style={styles.spotDistance}>
                                                        {formatDistance(spot.latitud, spot.longitud)}
                                                    </span>
                                                )}
                                                <RatingStars
                                                    rating={Math.round(spot.calificacionPromedio || 0)}
                                                    size={12}
                                                    darkMode={darkMode}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}><HiMagnifyingGlass size={40} /></div>
                            <div>No hay spots disponibles</div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SpotsSugeridos;
