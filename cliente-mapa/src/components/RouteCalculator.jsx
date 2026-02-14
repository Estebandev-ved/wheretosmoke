import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    HiMapPin,
    HiClock,
    HiShieldCheck,
    HiShieldExclamation,
    HiExclamationTriangle,
    HiPlay,
    HiXMark,
    HiArrowPath
} from 'react-icons/hi2';
import './RouteCalculator.css';

const API_BASE_URL = 'http://localhost:8081/api';

export default function RouteCalculator({ userLocation, onRouteCalculated, onModeChange, onSimulationStart, darkMode, onClose }) {
    const [origen, setOrigen] = useState(null);
    const [destino, setDestino] = useState(null);
    const [direccionOrigen, setDireccionOrigen] = useState('');
    const [direccionDestino, setDireccionDestino] = useState('');
    const [ruta, setRuta] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [paso, setPaso] = useState(0); // 0=inactivo, 1=seleccionar origen, 2=seleccionar destino

    // Ref para evitar problemas de closure
    const origenRef = useRef(null);

    useEffect(() => {
        origenRef.current = origen;
    }, [origen]);

    // Notificar al padre cuando cambia el modo
    useEffect(() => {
        onModeChange && onModeChange(paso);
    }, [paso, onModeChange]);

    // 📍 OBTENER DIRECCIÓN (Reverse Geocoding)
    const obtenerDireccion = async (lat, lng, tipo) => {
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'User-Agent': 'WhereToSmoke/1.0' } }
            );
            const direccion = response.data.display_name.split(',')[0]; // Tomar solo la primera parte (calle/número)

            if (tipo === 'origen') setDireccionOrigen(direccion);
            if (tipo === 'destino') setDireccionDestino(direccion);
        } catch (error) {
            console.error('Error obteniendo dirección:', error);
            if (tipo === 'origen') setDireccionOrigen(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            if (tipo === 'destino') setDireccionDestino(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
    };

    // Función expuesta para recibir clics del mapa
    useEffect(() => {
        window.handleRouteMapClick = (latLng) => {
            if (paso === 1) {
                setOrigen(latLng);
                origenRef.current = latLng;
                obtenerDireccion(latLng.lat, latLng.lng, 'origen');
                setPaso(2);
            } else if (paso === 2) {
                setDestino(latLng);
                obtenerDireccion(latLng.lat, latLng.lng, 'destino');
                calcularRuta(origenRef.current, latLng);
            }
        };

        return () => {
            delete window.handleRouteMapClick;
        };
    }, [paso]);

    const iniciarSeleccion = () => {
        setPaso(1);
        setOrigen(null);
        setDestino(null);
        setDireccionOrigen('');
        setDireccionDestino('');
        setRuta(null);
    };

    const usarUbicacionActual = () => {
        if (userLocation) {
            const loc = { lat: userLocation.lat, lng: userLocation.lng };
            setOrigen(loc);
            origenRef.current = loc;
            obtenerDireccion(loc.lat, loc.lng, 'origen');
            setPaso(2);
        } else {
            alert('Activa tu ubicación primero');
        }
    };

    const calcularRuta = async (origenCoords, destinoCoords) => {
        if (!origenCoords || !destinoCoords) {
            alert('Selecciona origen y destino primero');
            return;
        }
        setCargando(true);
        setPaso(0);
        try {
            const response = await axios.get(`${API_BASE_URL}/rutas/calcular`, {
                params: {
                    origenLat: origenCoords.lat,
                    origenLng: origenCoords.lng,
                    destinoLat: destinoCoords.lat,
                    destinoLng: destinoCoords.lng
                }
            });

            setRuta(response.data);
            onRouteCalculated && onRouteCalculated(response.data);
        } catch (error) {
            console.error('Error calculando ruta:', error);
            alert('Error al calcular la ruta');
            setPaso(0);
        } finally {
            setCargando(false);
        }
    };

    const reiniciar = () => {
        setOrigen(null);
        setDestino(null);
        setDireccionOrigen('');
        setDireccionDestino('');
        setRuta(null);
        setPaso(0);
        origenRef.current = null;
        onRouteCalculated && onRouteCalculated(null);
    };

    const getSeguridadInfo = () => {
        if (!ruta) return { color: '#999', texto: 'Calculando...', icon: <HiArrowPath className="spin" /> };
        if (ruta.reportesCercanos === 0) return { color: '#4CAF50', texto: 'Ruta segura', icon: <HiShieldCheck size={24} /> };
        if (ruta.reportesCercanos <= 2) return { color: '#FF9800', texto: 'Precaución', icon: <HiExclamationTriangle size={24} /> };
        return { color: '#F44336', texto: 'Peligrosa', icon: <HiShieldExclamation size={24} /> };
    };

    const formatearTiempo = (segundos) => {
        const minutos = Math.floor(segundos / 60);
        if (minutos < 60) return `${minutos} min`;
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${horas}h ${mins}m`;
    };

    const formatearDistancia = (metros) => {
        if (metros < 1000) return `${Math.round(metros)}m`;
        return `${(metros / 1000).toFixed(1)}km`;
    };

    const seguridad = getSeguridadInfo();

    // Mensajes de instrucción según el paso
    const getStepMessage = () => {
        if (paso === 1) return '👆 Toca en el mapa tu ubicación de origen';
        if (paso === 2) return '👆 Ahora toca en el mapa tu destino';
        return '';
    };

    return (
        <div className={`route-calculator ${darkMode ? '' : 'light'}`}>
            <div className="route-header">
                <div className="route-title">
                    <span className="route-icon"><HiMapPin size={24} color={darkMode ? "#2196F3" : "#0d47a1"} /></span>
                    <h3>Ruta de Bajo Perfil</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(ruta || paso > 0) && (
                        <button className="btn-new-route" onClick={reiniciar} title="Reiniciar búsqueda">
                            <HiArrowPath size={20} />
                        </button>
                    )}
                    <button className="btn-new-route" onClick={onClose} title="Cerrar">
                        <HiXMark size={20} />
                    </button>
                </div>
            </div>

            {/* ── PASO 0: Pantalla inicial ── */}
            {paso === 0 && !ruta && !cargando && (
                <div className="route-start">
                    <div className="start-message">
                        <p>Calcula rutas evitando reportes policiales</p>
                    </div>

                    {/* InDrive-style preview */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        gap: '10px',
                        marginBottom: '16px',
                        padding: '14px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', paddingTop: '2px'
                        }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00C851' }} />
                            <div style={{ width: '0', flex: 1, minHeight: '20px', borderLeft: '2px dashed rgba(255,255,255,0.15)', margin: '3px 0' }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5252' }} />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{
                                padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                                borderRadius: '10px', color: '#666', fontSize: '0.85rem',
                                border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                📍 ¿Dónde estás?
                            </div>
                            <div style={{
                                padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                                borderRadius: '10px', color: '#666', fontSize: '0.85rem',
                                border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                🎯 ¿A dónde vas?
                            </div>
                        </div>
                    </div>

                    <button className="btn-start-route" onClick={iniciarSeleccion}>
                        <HiArrowPath className="icon-mr" /> Empezar Ruta
                    </button>
                </div>
            )}

            {/* ── PASO 1 y 2: Seleccionando origen/destino ── */}
            {paso > 0 && !ruta && (
                <div className="route-setup">
                    {/* Banner con instrucciones claras */}
                    <div style={{
                        padding: '10px 14px',
                        background: paso === 1 ? 'rgba(0,200,81,0.1)' : 'rgba(255,82,82,0.1)',
                        borderRadius: '12px',
                        color: paso === 1 ? '#69F0AE' : '#FF8A80',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        marginBottom: '14px',
                        border: paso === 1 ? '1px solid rgba(0,200,81,0.2)' : '1px solid rgba(255,82,82,0.2)',
                        animation: 'pulse-instruction 2s infinite'
                    }}>
                        {getStepMessage()}
                    </div>

                    {/* InDrive-style vertical route indicator */}
                    <div style={{
                        display: 'flex', alignItems: 'stretch', gap: '10px',
                        marginBottom: '14px', padding: '14px',
                        background: 'rgba(255,255,255,0.04)', borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        {/* Vertical dots */}
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', paddingTop: '2px'
                        }}>
                            <div style={{
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: origen ? '#00C851' : (paso === 1 ? '#00C851' : '#444'),
                                boxShadow: paso === 1 ? '0 0 10px rgba(0,200,81,0.4)' : 'none',
                                border: paso === 1 ? '2px solid rgba(0,200,81,0.5)' : '2px solid transparent',
                                transition: 'all 0.3s'
                            }} />
                            <div style={{
                                width: '0', flex: 1, minHeight: '20px',
                                borderLeft: '2px dashed rgba(255,255,255,0.15)', margin: '3px 0'
                            }} />
                            <div style={{
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: destino ? '#FF5252' : (paso === 2 ? '#FF5252' : '#444'),
                                boxShadow: paso === 2 ? '0 0 10px rgba(255,82,82,0.4)' : 'none',
                                border: paso === 2 ? '2px solid rgba(255,82,82,0.5)' : '2px solid transparent',
                                transition: 'all 0.3s'
                            }} />
                        </div>

                        {/* Input fields */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{
                                padding: '10px 12px',
                                background: paso === 1 ? 'rgba(0,200,81,0.08)' : (origen ? 'rgba(0,200,81,0.06)' : 'rgba(255,255,255,0.04)'),
                                borderRadius: '10px',
                                color: origen ? '#69F0AE' : (paso === 1 ? '#00C851' : '#666'),
                                fontSize: '0.82rem',
                                border: paso === 1 ? '1px solid rgba(0,200,81,0.2)' : (origen ? '1px solid rgba(0,200,81,0.15)' : '1px solid rgba(255,255,255,0.06)'),
                                fontWeight: origen ? '600' : (paso === 1 ? '600' : '400'),
                                transition: 'all 0.3s',
                                fontFamily: origen ? "'Courier New', monospace" : 'inherit',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                                {origen
                                    ? `✅ ${direccionOrigen || 'Ubicación seleccionada'}`
                                    : (paso === 1 ? '📍 Toca el mapa...' : '📍 Origen pendiente')
                                }
                            </div>
                            <div style={{
                                padding: '10px 12px',
                                background: paso === 2 ? 'rgba(255,82,82,0.08)' : 'rgba(255,255,255,0.04)',
                                borderRadius: '10px',
                                color: destino ? '#FF8A80' : (paso === 2 ? '#FF5252' : '#555'),
                                fontSize: '0.82rem',
                                border: paso === 2 ? '1px solid rgba(255,82,82,0.2)' : '1px solid rgba(255,255,255,0.06)',
                                fontWeight: paso === 2 ? '600' : '400',
                                transition: 'all 0.3s',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                                {destino
                                    ? `✅ ${direccionDestino || 'Destino seleccionado'}`
                                    : (paso === 2 ? '🎯 Toca el mapa...' : '🎯 Destino pendiente')
                                }
                            </div>
                        </div>
                    </div>

                    {/* Botón usar ubicación (solo en paso 1) */}
                    {paso === 1 && (
                        <button className="btn-use-location" onClick={usarUbicacionActual}>
                            <HiMapPin className="icon-mr" /> Usar mi ubicación
                        </button>
                    )}

                    <button className="btn-cancel" onClick={reiniciar}>
                        Cancelar
                    </button>

                    {cargando && (
                        <div className="loading-overlay">
                            <div className="spinner-route"></div>
                            <p>Buscando ruta segura...</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Loading sin pasos ── */}
            {paso === 0 && !ruta && cargando && (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                    <div className="spinner-route"></div>
                    <p style={{ color: '#00C851', fontSize: '0.9rem' }}>Calculando ruta segura...</p>
                </div>
            )}

            {/* ── RESULTADOS ── */}
            {ruta && (
                <div className="route-results">
                    <div className="result-cards">
                        <div className="result-card">
                            <div className="card-icon"><HiMapPin size={24} /></div>
                            <div className="card-content">
                                <span className="card-label">Distancia</span>
                                <span className="card-value">{formatearDistancia(ruta.distanciaMetros)}</span>
                            </div>
                        </div>

                        <div className="result-card">
                            <div className="card-icon"><HiClock size={24} /></div>
                            <div className="card-content">
                                <span className="card-label">Tiempo</span>
                                <span className="card-value">{formatearTiempo(ruta.tiempoSegundos)}</span>
                            </div>
                        </div>

                        <div className="result-card safety" style={{ borderColor: seguridad.color }}>
                            <div className="card-icon" style={{ color: seguridad.color }}>{seguridad.icon}</div>
                            <div className="card-content">
                                <span className="card-label">Seguridad</span>
                                <span className="card-value" style={{ color: seguridad.color }}>
                                    {seguridad.texto}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Botón Simular */}
                    <div style={{ marginBottom: '14px' }}>
                        <button
                            className="btn-simular"
                            onClick={() => onSimulationStart && onSimulationStart(ruta)}
                        >
                            <HiPlay size={24} style={{ marginRight: '8px' }} /> Simular Recorrido
                        </button>
                    </div>

                    {ruta.reportesCercanos > 0 ? (
                        <div className="warnings-section">
                            <h4 className="warnings-title">
                                <HiExclamationTriangle size={20} style={{ marginRight: '5px' }} />
                                {ruta.reportesCercanos} reporte{ruta.reportesCercanos > 1 ? 's' : ''} cerca
                            </h4>
                            <ul className="warnings-list">
                                {ruta.reportes.slice(0, 3).map((reporte, idx) => (
                                    <li key={idx} className="warning-item">
                                        <span className="warning-icon"><HiShieldExclamation /></span>
                                        <span>{reporte.tipo}</span>
                                        <span className="warning-time">
                                            {new Date(reporte.timestamp).toLocaleTimeString('es-CO', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {ruta.reportes.length > 3 && (
                                <div className="more-reports">
                                    +{ruta.reportes.length - 3} más
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="safe-message">
                            <div className="safe-icon" style={{ fontSize: '2rem', marginBottom: '5px' }}>
                                <HiShieldCheck size={40} color="#4CAF50" />
                            </div>
                            <div>
                                <strong style={{ color: '#4CAF50' }}>¡Ruta segura!</strong>
                                <p>No hay reportes policiales en esta zona</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
