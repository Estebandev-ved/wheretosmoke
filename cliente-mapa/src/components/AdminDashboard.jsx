import { API_BASE } from '../config';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../admin.css';

const API_BASE_URL = API_BASE;

/**
 * 📊 ADMIN DASHBOARD - Panel principal de estadísticas
 * 
 * Muestra métricas generales del sistema:
 * - Usuarios (total, activos, baneados, nuevos)
 * - Spots (total, activos, fla ggeados, nuevos)
 * - Engagement (votos, comentarios, favoritos)
 * - Distribución por categoría
 */
const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();

        // Auto-refresh cada 30 segundos
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStats(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar estadísticas');
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="admin-loading">⏳ Cargando estadísticas...</div>;
    }

    if (error) {
        return <div className="admin-error">❌ {error}</div>;
    }

    if (!stats) {
        return <div className="admin-error">❌ No se pudieron cargar las estadísticas</div>;
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>📊 Dashboard de Administración</h1>
                <p className="admin-subtitle">Panel de control nivel dios </p>
            </div>

            {/* MÉTRICAS PRINCIPALES */}
            <div className="stats-grid">
                {/* USUARIOS */}
                <div className="stat-card usuarios">
                    <div className="stat-icon"></div>
                    <div className="stat-content">
                        <h3>Usuarios</h3>
                        <div className="stat-number">{stats.totalUsuarios}</div>
                        <div className="stat-details">
                            <span className="stat-item"> {stats.usuariosActivos} activos</span>
                            <span className="stat-item"> {stats.usuariosBaneados} baneados</span>
                        </div>
                        <div className="stat-trend">
                            <span>📈 Hoy: +{stats.nuevosUsuariosHoy}</span>
                            <span>📅 Semana: +{stats.nuevosUsuariosSemana}</span>
                        </div>
                    </div>
                </div>

                {/* SPOTS */}
                <div className="stat-card spots">
                    <div className="stat-icon">📍</div>
                    <div className="stat-content">
                        <h3>Spots</h3>
                        <div className="stat-number">{stats.totalSpots}</div>
                        <div className="stat-details">
                            <span className="stat-item">✅ {stats.spotsActivos} activos</span>
                            <span className="stat-item">🚩 {stats.spotsFlaggeados} flaggeados</span>
                        </div>
                        <div className="stat-trend">
                            <span>📈 Hoy: +{stats.nuevosSpotsHoy}</span>
                            <span>📅 Semana: +{stats.nuevosSpotsSemana}</span>
                        </div>
                    </div>
                </div>

                {/* VOTOS */}
                <div className="stat-card votos">
                    <div className="stat-icon">🗳️</div>
                    <div className="stat-content">
                        <h3>Votos</h3>
                        <div className="stat-number">{stats.totalVotos}</div>
                        <div className="stat-details">
                            <span className="stat-item tombo">🚨 {stats.totalVotosTombo} TOMBO</span>
                            <span className="stat-item relax">🥦 {stats.totalVotosRelax} RELAX</span>
                        </div>
                        <div className="stat-trend">
                            <span>📈 Últimas 24h: {stats.votosUltimas24h}</span>
                        </div>
                    </div>
                </div>

                {/* ENGAGEMENT */}
                <div className="stat-card engagement">
                    <div className="stat-icon">💬</div>
                    <div className="stat-content">
                        <h3>Engagement</h3>
                        <div className="stat-number">{stats.totalComentarios}</div>
                        <div className="stat-details">
                            <span className="stat-item">💬 {stats.totalComentarios} comentarios</span>
                            <span className="stat-item">⭐ {stats.totalFavoritos} favoritos</span>
                        </div>
                        <div className="stat-trend">
                            <span>📸 {stats.totalFotos} fotos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DISTRIBUCIÓN POR CATEGORÍA */}
            {stats.spotsPorCategoria && (
                <div className="category-distribution">
                    <h2>📊 Distribución de Spots por Categoría</h2>
                    <div className="category-grid">
                        {Object.entries(stats.spotsPorCategoria).map(([categoria, cantidad]) => (
                            <div key={categoria} className="category-item">
                                <span className="category-name">{categoria}</span>
                                <div className="category-bar">
                                    <div
                                        className="category-fill"
                                        style={{ width: `${(cantidad / stats.totalSpots) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="category-count">{cantidad}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TENDENCIAS */}
            {stats.registrosPorDia && (
                <div className="trends-section">
                    <h2>📈 Tendencias (Últimos 7 días)</h2>
                    <div className="trends-grid">
                        <div className="trend-card">
                            <h3>Registros por día</h3>
                            <div className="trend-chart">
                                {Object.entries(stats.registrosPorDia).map(([fecha, cantidad]) => (
                                    <div key={fecha} className="chart-bar">
                                        <div
                                            className="bar-fill registros"
                                            style={{ height: `${Math.max(cantidad * 10, 5)}px` }}
                                            title={`${fecha}: ${cantidad} registros`}
                                        ></div>
                                        <span className="bar-label">{fecha.split('-')[2]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ACCIONES RÁPIDAS */}
            <div className="quick-actions">
                <h2>⚡ Acciones Rápidas</h2>
                <div className="action-buttons">
                    <button className="action-btn users" onClick={() => window.location.hash = '#users'}>
                        👥 Gestionar Usuarios
                    </button>
                    <button className="action-btn spots" onClick={() => window.location.hash = '#spots'}>
                        📍 Gestionar Spots
                    </button>
                    <button className="action-btn flagged" onClick={() => window.location.hash = '#spots-flagged'}>
                        🚩 Ver Flaggeados
                    </button>
                    <button className="action-btn refresh" onClick={fetchStats}>
                        🔄 Actualizar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
