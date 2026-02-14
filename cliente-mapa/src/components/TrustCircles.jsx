import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './TrustCircles.css';

const API_BASE_URL = 'http://localhost:8081/api';

export default function TrustCircles({ userLocation, onCircleMembersUpdate, onClose, darkMode }) {
    const { user } = useAuth();
    // ... (state remains same)
    const [circles, setCircles] = useState([]);
    const [selectedCircle, setSelectedCircle] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newCircleName, setNewCircleName] = useState('');
    const [newCircleColor, setNewCircleColor] = useState('#4CAF50');
    const [inviteCode, setInviteCode] = useState('');
    const [wsConnection, setWsConnection] = useState(null);
    const [sharingLocation, setSharingLocation] = useState({});

    // Cargar círculos del usuario
    const loadCircles = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No hay token, usuario no autenticado');
                return;
            }
            const response = await axios.get(`${API_BASE_URL}/circulos/mis-circulos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCircles(response.data);
        } catch (error) {
            console.error('Error cargando círculos:', error);
        }
    };

    useEffect(() => {
        loadCircles();
    }, []);

    // WebSocket para ubicaciones en tiempo real
    useEffect(() => {
        if (!selectedCircle) return;

        const token = localStorage.getItem('token');
        const ws = new WebSocket(`ws://localhost:8081/ws?token=${token}`);

        ws.onopen = () => {
            console.log('WebSocket conectado para círculo:', selectedCircle.id);
            ws.send(JSON.stringify({
                type: 'subscribe',
                topic: `/topic/circulo/${selectedCircle.id}/ubicaciones`
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Actualizar miembros con nuevas ubicaciones
            if (data.ubicacion) {
                onCircleMembersUpdate && onCircleMembersUpdate(data);
            }
        };

        setWsConnection(ws);

        return () => {
            ws.close();
        };
    }, [selectedCircle]);

    // Crear círculo
    const handleCreateCircle = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/circulos`, {
                nombre: newCircleName,
                color: newCircleColor
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert(`Círculo creado! Código de invitación: ${response.data.codigoInvitacion}`);
            setNewCircleName('');
            setShowCreateModal(false);
            loadCircles();
        } catch (error) {
            console.error('Error creando círculo:', error);
            alert('Error al crear círculo');
        }
    };

    // Unirse a círculo
    const handleJoinCircle = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/circulos/unirse`, {
                codigoInvitacion: inviteCode
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('Te uniste al círculo exitosamente');
            setInviteCode('');
            setShowJoinModal(false);
            loadCircles();
        } catch (error) {
            console.error('Error uniéndose al círculo:', error);
            alert('Código de invitación inválido');
        }
    };

    // Compartir ubicación
    const toggleShareLocation = async (circleId) => {
        if (sharingLocation[circleId]) {
            // Dejar de compartir
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/circulos/${circleId}/ubicacion`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSharingLocation({ ...sharingLocation, [circleId]: false });
            } catch (error) {
                console.error('Error deteniendo ubicación:', error);
            }
        } else {
            // Empezar a compartir
            if (!userLocation) {
                alert('Activa tu ubicación primero');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                await axios.post(`${API_BASE_URL}/circulos/${circleId}/ubicacion`, {
                    latitud: userLocation.lat,
                    longitud: userLocation.lng
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSharingLocation({ ...sharingLocation, [circleId]: true });

                // Actualizar ubicación cada 30 segundos
                const interval = setInterval(async () => {
                    if (sharingLocation[circleId] && userLocation) {
                        await axios.post(`${API_BASE_URL}/circulos/${circleId}/ubicacion`, {
                            latitud: userLocation.lat,
                            longitud: userLocation.lng
                        }, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    }
                }, 30000);

                return () => clearInterval(interval);
            } catch (error) {
                console.error('Error compartiendo ubicación:', error);
            }
        }
    };

    return (
        <>
            <div className={`trust-circles-container ${darkMode ? '' : 'light'}`}>
                <div className="trust-circles-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2>👥 Círculos</h2>
                    </div>

                    <div className="trust-circles-actions">
                        <button className="btn-create" onClick={() => setShowCreateModal(true)} title="Crear nuevo círculo">
                            ➕
                        </button>
                        <button className="btn-join" onClick={() => setShowJoinModal(true)} title="Unirse a un círculo">
                            🔗
                        </button>
                        <button className="btn-close-modal" onClick={onClose} title="Cerrar ventana">
                            ✕
                        </button>
                    </div>
                </div>

                <div className="circles-list">
                    {circles.map(circle => (
                        <div
                            key={circle.id}
                            className={`circle-card ${selectedCircle?.id === circle.id ? 'selected' : ''}`}
                            onClick={() => setSelectedCircle(circle)}
                        >
                            <div className="circle-header" style={{ borderLeft: `4px solid ${circle.color}` }}>
                                <h3>{circle.nombre}</h3>
                                <span className="members-count">{circle.totalMiembros} miembros</span>
                            </div>

                            <div className="circle-code">
                                Código: <strong>{circle.codigoInvitacion}</strong>
                            </div>

                            <div className="circle-actions">
                                <button
                                    className={`btn-share ${sharingLocation[circle.id] ? 'sharing' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleShareLocation(circle.id);
                                    }}
                                >
                                    {sharingLocation[circle.id] ? '📍 Compartiendo...' : '📍 Compartir ubicación'}
                                </button>
                            </div>

                            {selectedCircle?.id === circle.id && (
                                <div className="circle-members">
                                    <h4>Miembros:</h4>
                                    {circle.miembros.map(member => (
                                        <div key={member.usuarioId} className="member-item">
                                            <span>{member.username}</span>
                                            {member.compartiendoUbicacion && (
                                                <span className="sharing-badge">📍 Compartiendo</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Crear Círculo — Portal para escapar del DOM del wrapper */}
            {showCreateModal && createPortal(
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Crear Círculo</h3>
                        <input
                            type="text"
                            placeholder="Nombre del círculo"
                            value={newCircleName}
                            onChange={(e) => setNewCircleName(e.target.value)}
                        />
                        <div className="color-picker">
                            <label>Color:</label>
                            <input
                                type="color"
                                value={newCircleColor}
                                onChange={(e) => setNewCircleColor(e.target.value)}
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleCreateCircle}>Crear</button>
                            <button onClick={() => setShowCreateModal(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal Unirse — Portal para escapar del DOM del wrapper */}
            {showJoinModal && createPortal(
                <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>🔗 Unirse a un Círculo</h3>
                        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '14px' }}>
                            Pega el código de invitación que te compartieron
                        </p>
                        <input
                            type="text"
                            placeholder="Ej: ABC123XY"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '1.1rem' }}
                        />
                        <div className="modal-actions">
                            <button onClick={handleJoinCircle}>Unirse</button>
                            <button onClick={() => setShowJoinModal(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
