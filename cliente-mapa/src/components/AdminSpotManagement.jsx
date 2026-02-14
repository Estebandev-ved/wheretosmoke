import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmDialog from './ConfirmDialog';
import '../admin.css';

const API_BASE_URL = 'http://localhost:8081/api';

/**
 * 📍 ADMIN SPOT MANAGEMENT - Gestión de spots
 * 
 * Permite al admin:
 * - Ver todos los spots con detalles
 * - Eliminar spots
 * - Marcar spots como flaggeados
 * - Ver spots reportados
 * - Filtrar por categoría y estado
 */
const AdminSpotManagement = () => {
    const [spots, setSpots] = useState([]);
    const [filteredSpots, setFilteredSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [showFlagged, setShowFlagged] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: 'warning', title: '', message: '', onConfirm: null });

    useEffect(() => {
        fetchSpots();
    }, [showFlagged]);

    useEffect(() => {
        // Aplicar filtros
        let filtered = spots;

        // Filtro de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.creadorUsername.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro de categoría
        if (filterCategory !== 'ALL') {
            filtered = filtered.filter(s => s.categoria === filterCategory);
        }

        // Filtro de estado
        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(s => s.estado === filterStatus);
        }

        setFilteredSpots(filtered);
    }, [searchTerm, filterCategory, filterStatus, spots]);

    const fetchSpots = async () => {
        try {
            const token = localStorage.getItem('token');
            const endpoint = showFlagged
                ? `${API_BASE_URL}/admin/spots/flagged`
                : `${API_BASE_URL}/admin/spots`;

            const response = await axios.get(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSpots(response.data);
            setFilteredSpots(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error al cargar spots:', err);
            setLoading(false);
        }
    };

    const handleDeleteSpot = (spotId) => {
        setConfirmDialog({
            isOpen: true,
            type: 'danger',
            title: '¿Eliminar este spot?',
            message: 'Se eliminarán todos sus datos (comentarios, fotos, favoritos). Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    const token = localStorage.getItem('token');
                    await axios.delete(`${API_BASE_URL}/admin/spots/${spotId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    fetchSpots();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                    // Show success
                    setConfirmDialog({
                        isOpen: true,
                        type: 'success',
                        title: '✅ Spot eliminado',
                        message: 'El spot ha sido eliminado exitosamente',
                        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false }),
                        confirmText: 'OK',
                        cancelText: null
                    });
                } catch (err) {
                    setConfirmDialog({
                        isOpen: true,
                        type: 'danger',
                        title: '❌ Error',
                        message: 'No se pudo eliminar el spot. Intenta nuevamente.',
                        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false }),
                        confirmText: 'OK',
                        cancelText: null
                    });
                }
            },
            onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
    };

    const handleFlagSpot = (spotId, currentlyFlagged) => {
        const action = currentlyFlagged ? 'desmarcar' : 'marcar';
        setConfirmDialog({
            isOpen: true,
            type: currentlyFlagged ? 'success' : 'warning',
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} como inapropiado?`,
            message: currentlyFlagged
                ? 'El spot volverá a estar visible normalmente'
                : 'El spot será marcado como contenido inapropiado',
            onConfirm: async () => {
                try {
                    const token = localStorage.getItem('token');
                    await axios.post(`${API_BASE_URL}/admin/spots/${spotId}/flag`, {}, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    fetchSpots();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                } catch (err) {
                    setConfirmDialog({
                        isOpen: true,
                        type: 'danger',
                        title: '❌ Error',
                        message: `No se pudo ${action} el spot`,
                        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false }),
                        confirmText: 'OK',
                        cancelText: null
                    });
                }
            },
            onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
    };

    if (loading) {
        return <div className="admin-loading">⏳ Cargando spots...</div>;
    }

    return (
        <div className="admin-spot-management">
            <div className="admin-header">
                <h1>📍 Gestión de Spots</h1>
                <p className="admin-subtitle">Total: {spots.length} spots</p>
            </div>

            {/* TAB SELECTOR */}
            <div className="tab-selector">
                <button
                    className={`tab-btn ${!showFlagged ? 'active' : ''}`}
                    onClick={() => setShowFlagged(false)}
                >
                    📍 Todos los Spots
                </button>
                <button
                    className={`tab-btn ${showFlagged ? 'active' : ''}`}
                    onClick={() => setShowFlagged(true)}
                >
                    🚩 Flaggeados ({spots.filter(s => s.flaggeado).length})
                </button>
            </div>

            {/* FILTROS Y BÚSQUEDA */}
            <div className="admin-filters">
                <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o creador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
                    <option value="ALL">Todas las categorías</option>
                    <option value="PARQUE">PARQUE</option>
                    <option value="CALLE">CALLE</option>
                    <option value="PLAZA">PLAZA</option>
                    <option value="BAR">BAR</option>
                    <option value="RESTAURANTE">RESTAURANTE</option>
                    <option value="CAFE">CAFE</option>
                    <option value="OTRO">OTRO</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                    <option value="ALL">Todos los estados</option>
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="VERDE">VERDE</option>
                    <option value="ROJO">ROJO</option>
                    <option value="REPORTADO">REPORTADO</option>
                </select>
            </div>

            {/* GRID DE SPOTS */}
            <div className="spots-grid">
                {filteredSpots.map(spot => (
                    <div key={spot.id} className={`spot-card ${spot.flaggeado ? 'flagged' : ''}`}>
                        <div className="spot-header">
                            <h3>{spot.nombre}</h3>
                            {spot.flaggeado && <span className="flag-badge">🚩 FLAGGED</span>}
                        </div>

                        <div className="spot-info">
                            <p className="spot-category">{spot.categoria}</p>
                            <p className="spot-creator">👤 {spot.creadorUsername}</p>
                            <p className="spot-location">📍 {spot.latitud?.toFixed(4)}, {spot.longitud?.toFixed(4)}</p>
                            {spot.descripcion && <p className="spot-description">{spot.descripcion}</p>}
                        </div>

                        <div className="spot-stats">
                            <div className="stat-item">
                                <span className="stat-label">Votos TOMBO</span>
                                <span className="stat-value tombo">{spot.totalVotosTombo || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Votos RELAX</span>
                                <span className="stat-value relax">{spot.totalVotosRelax || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Comentarios</span>
                                <span className="stat-value">{spot.totalComentarios || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Fotos</span>
                                <span className="stat-value">{spot.totalFotos || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Favoritos</span>
                                <span className="stat-value">{spot.totalFavoritos || 0}</span>
                            </div>
                            {spot.calificacionPromedio && (
                                <div className="stat-item">
                                    <span className="stat-label">Calificación</span>
                                    <span className="stat-value">⭐ {spot.calificacionPromedio.toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        <div className="spot-actions">
                            <button
                                className={`btn-small ${spot.flaggeado ? 'btn-unflag' : 'btn-flag'}`}
                                onClick={() => handleFlagSpot(spot.id, spot.flaggeado)}
                                title={spot.flaggeado ? 'Desmarcar como inapropiado' : 'Marcar como inapropiado'}
                            >
                                {spot.flaggeado ? '✅ Desmarcar' : '🚩 Flaggear'}
                            </button>
                            <button
                                className="btn-small btn-delete"
                                onClick={() => handleDeleteSpot(spot.id)}
                                title="Eliminar spot"
                            >
                                🗑️ Eliminar
                            </button>
                            <a
                                href={`https://www.google.com/maps?q=${spot.latitud},${spot.longitud}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-small btn-map"
                            >
                                🗺️ Ver en Mapa
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {filteredSpots.length === 0 && (
                <div className="no-results">
                    No se encontraron spots con los filtros aplicados
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                type={confirmDialog.type}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={confirmDialog.onCancel}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
            />
        </div>
    );
};

export default AdminSpotManagement;
