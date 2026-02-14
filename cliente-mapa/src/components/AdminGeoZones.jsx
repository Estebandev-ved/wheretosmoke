import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ZonaEditor from './ZonaEditor';
import './admin-geozonas.css';

/**
 * 🗺️ ADMIN PANEL - Gestión de Geo-Zonas
 * 
 * Panel para administradores para gestionar zonas geográficas
 */
const AdminGeoZones = () => {
    const { token } = useAuth();
    const [zonas, setZonas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ zonasActivas: 0, zonasTotal: 0 });
    const [editorOpen, setEditorOpen] = useState(false);

    useEffect(() => {
        cargarZonas();
        cargarEstadisticas();
    }, []);

    const cargarZonas = async () => {
        try {
            const { data } = await axios.get('http://localhost:8081/api/admin/geozonas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setZonas(data);
            console.log('🗺️ Zonas cargadas:', data.length);
        } catch (error) {
            console.error('Error cargando zonas:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarEstadisticas = async () => {
        try {
            const { data } = await axios.get('http://localhost:8081/api/admin/geozonas/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
        } catch (error) {
            console.error('Error cargando stats:', error);
        }
    };

    const toggleZona = async (zona) => {
        try {
            const endpoint = zona.activa ? 'desactivar' : 'activar';
            const { data } = await axios.patch(
                `http://localhost:8081/api/admin/geozonas/${zona.id}/${endpoint}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Actualizar zona en lista
            setZonas(zonas.map(z => z.id === zona.id ? data : z));
            cargarEstadisticas(); // Actualizar stats

            console.log(`✅ Zona ${zona.nombre} ${endpoint}da`);
        } catch (error) {
            console.error('Error actualizando zona:', error);
            alert('Error actualizando zona');
        }
    };

    const eliminarZona = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar esta zona?')) return;

        try {
            await axios.delete(`http://localhost:8081/api/admin/geozonas/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setZonas(zonas.filter(z => z.id !== id));
            cargarEstadisticas();
            console.log('🗑️ Zona eliminada');
        } catch (error) {
            console.error('Error eliminando zona:', error);
            alert('Error eliminando zona');
        }
    };

    if (loading) {
        return (
            <div className="admin-geozonas-loading">
                <div className="spinner"></div>
                <p>Cargando zonas...</p>
            </div>
        );
    }

    return (
        <div className="admin-geozonas">
            {/* Header con estadísticas */}
            <div className="geozonas-header">
                <div>
                    <h2>🗺️ Gestión de Geo-Zonas</h2>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div className="geozonas-stats">
                        <div className="stat-card active">
                            <span className="stat-number">{stats.zonasActivas}</span>
                            <span className="stat-label">Activas</span>
                        </div>
                        <div className="stat-card total">
                            <span className="stat-number">{stats.zonasTotal}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>
                    <button
                        className="btn-create-zone"
                        onClick={() => setEditorOpen(true)}
                    >
                        ➕ Crear Zona
                    </button>
                </div>
            </div>

            {/* Grid de zonas */}
            <div className="zonas-grid">
                {zonas.map(zona => (
                    <div
                        key={zona.id}
                        className={`zona-card ${zona.activa ? 'activa' : 'inactiva'}`}
                    >
                        {/* Header de la tarjeta */}
                        <div className="zona-card-header">
                            <div className="zona-info">
                                <h3>{zona.nombre}</h3>
                                <span className="zona-tipo">{zona.tipo}</span>
                            </div>
                            <div
                                className="zona-color-indicator"
                                style={{ backgroundColor: zona.color }}
                            ></div>
                        </div>

                        {/* Descripción */}
                        {zona.descripcion && (
                            <p className="zona-descripcion">{zona.descripcion}</p>
                        )}

                        {/* Stats de la zona */}
                        <div className="zona-stats">
                            <div className="zona-stat">
                                <span className="label">Spots:</span>
                                <span className="value">{zona.totalSpots || 0}</span>
                            </div>
                            <div className="zona-stat">
                                <span className="label">Orden:</span>
                                <span className="value">#{zona.orden}</span>
                            </div>
                        </div>

                        {/* Fechas */}
                        <div className="zona-dates">
                            {zona.fechaActivacion && (
                                <small>
                                    ✅ Activada: {new Date(zona.fechaActivacion).toLocaleDateString()}
                                </small>
                            )}
                            {!zona.activa && (
                                <small className="inactive-text">
                                    🚧 Zona bloqueada
                                </small>
                            )}
                        </div>

                        {/* Acciones */}
                        <div className="zona-actions">
                            {/* Toggle switch */}
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={zona.activa}
                                    onChange={() => toggleZona(zona)}
                                />
                                <span className="toggle-slider"></span>
                                <span className="toggle-label">
                                    {zona.activa ? 'Habilitada' : 'Bloqueada'}
                                </span>
                            </label>

                            {/* Botón eliminar */}
                            <button
                                className="btn-delete"
                                onClick={() => eliminarZona(zona.id)}
                                title="Eliminar zona"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {zonas.length === 0 && (
                <div className="empty-state">
                    <p>No hay zonas configuradas</p>
                    <button
                        className="btn-create-zone"
                        onClick={() => setEditorOpen(true)}
                    >
                        ➕ Crear Primera Zona
                    </button>
                </div>
            )}

            {/* Editor Modal */}
            <ZonaEditor
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                onSave={(nuevaZona) => {
                    setZonas([...zonas, nuevaZona]);
                    cargarEstadisticas();
                }}
            />
        </div>
    );
};

export default AdminGeoZones;
