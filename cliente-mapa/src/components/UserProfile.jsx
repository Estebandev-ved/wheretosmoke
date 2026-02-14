import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import PushNotificationButton from './PushNotificationButton';
import RatingStars from './RatingStars';

const API_URL = 'http://localhost:8081/api';

/**
 * 👤 PERFIL DE USUARIO
 * 
 * Vista completa del perfil con stats, badges, favoritos y spots creados
 */
const UserProfile = ({
    isOpen = false,
    onClose = () => { },
    darkMode = false
}) => {
    const { user, token, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('stats');
    const [perfil, setPerfil] = useState(null);
    const [favoritos, setFavoritos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            cargarDatos();
        }
    }, [isOpen, user]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [perfilRes, favoritosRes] = await Promise.all([
                axios.get(`${API_URL}/gamificacion/perfil`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/favoritos`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setPerfil(perfilRes.data);
            setFavoritos(favoritosRes.data);
        } catch (error) {
            console.error('Error cargando perfil:', error);
            toast.error('Error cargando perfil');
        }
        setLoading(false);
    };

    const handleLogout = () => {
        logout();
        onClose();
        toast.success('👋 ¡Hasta pronto!');
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getLevelInfo = (points) => {
        if (points >= 500) return { level: 'Leyenda', color: '#FFD700', next: null };
        if (points >= 200) return { level: 'Experto', color: '#C0C0C0', next: 500 };
        if (points >= 100) return { level: 'Veterano', color: '#CD7F32', next: 200 };
        if (points >= 50) return { level: 'Regular', color: '#00C851', next: 100 };
        return { level: 'Novato', color: '#888', next: 50 };
    };

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 2000,
            display: isOpen ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.3s ease'
        },
        modal: {
            width: '100%',
            maxWidth: '420px',
            maxHeight: '85vh',
            backgroundColor: darkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            animation: 'scaleIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        },
        header: {
            padding: '30px 20px',
            background: darkMode
                ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                : 'linear-gradient(135deg, #f5f5f7 0%, #e8e8e8 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
        },
        closeBtn: {
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            color: darkMode ? 'white' : '#333',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
        },
        avatar: {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00C851 0%, #00a844 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 0 30px rgba(0,200,81,0.4)',
            marginBottom: '15px'
        },
        username: {
            fontSize: '20px',
            fontWeight: '700',
            color: darkMode ? 'white' : '#333',
            margin: 0
        },
        levelBadge: (color) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 12px',
            borderRadius: '100px',
            background: `${color}22`,
            color: color,
            fontSize: '12px',
            fontWeight: '600',
            marginTop: '8px'
        }),
        statsRow: {
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '20px',
            padding: '0 20px'
        },
        statItem: {
            textAlign: 'center'
        },
        statValue: {
            fontSize: '24px',
            fontWeight: '800',
            color: darkMode ? 'white' : '#333',
            lineHeight: 1
        },
        statLabel: {
            fontSize: '11px',
            color: darkMode ? '#888' : '#666',
            marginTop: '4px'
        },
        tabs: {
            display: 'flex',
            borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        },
        tab: (active) => ({
            flex: 1,
            padding: '14px',
            border: 'none',
            backgroundColor: 'transparent',
            color: active
                ? '#00C851'
                : (darkMode ? '#888' : '#999'),
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: active ? '600' : '400',
            borderBottom: active ? '2px solid #00C851' : '2px solid transparent',
            transition: 'all 0.2s'
        }),
        content: {
            flex: 1,
            overflowY: 'auto',
            padding: '20px'
        },
        badgeCard: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: '12px',
            marginBottom: '10px',
            animation: 'fadeInUp 0.3s ease backwards'
        },
        badgeIcon: {
            fontSize: '28px'
        },
        badgeInfo: {
            flex: 1
        },
        badgeName: {
            fontWeight: '600',
            color: darkMode ? 'white' : '#333',
            fontSize: '14px'
        },
        badgeDesc: {
            fontSize: '12px',
            color: darkMode ? '#888' : '#666'
        },
        spotCard: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: '12px',
            marginBottom: '10px'
        },
        spotInfo: {
            flex: 1
        },
        spotName: {
            fontWeight: '600',
            color: darkMode ? 'white' : '#333',
            fontSize: '14px'
        },
        spotStatus: (estado) => ({
            fontSize: '11px',
            color: estado === 'ROJO' ? '#ff4444' : '#00C851'
        }),
        progressBar: {
            width: '100%',
            height: '6px',
            background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '15px'
        },
        progressFill: (percent) => ({
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00C851 0%, #00a844 100%)',
            borderRadius: '3px',
            transition: 'width 0.5s ease'
        }),
        logoutBtn: {
            width: '100%',
            padding: '14px',
            border: 'none',
            borderRadius: '12px',
            background: 'rgba(255,68,68,0.15)',
            color: '#ff4444',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '20px',
            transition: 'all 0.2s'
        },
        emptyState: {
            textAlign: 'center',
            padding: '40px 20px',
            color: darkMode ? '#666' : '#999'
        }
    };

    if (!isOpen) return null;

    const levelInfo = getLevelInfo(perfil?.puntos || 0);
    const progressToNext = levelInfo.next
        ? ((perfil?.puntos || 0) / levelInfo.next) * 100
        : 100;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.closeBtn} onClick={onClose}>×</button>

                    <div style={styles.avatar}>
                        {getInitials(user?.username)}
                    </div>

                    <h2 style={styles.username}>{user?.username || 'Usuario'}</h2>

                    <div style={styles.levelBadge(levelInfo.color)}>
                        ⭐ {levelInfo.level}
                    </div>

                    {/* Stats rápidos */}
                    {!loading && perfil && (
                        <div style={styles.statsRow}>
                            <div style={styles.statItem}>
                                <div style={styles.statValue}>{perfil.puntos}</div>
                                <div style={styles.statLabel}>💨 Humo</div>
                            </div>
                            <div style={styles.statItem}>
                                <div style={styles.statValue}>{perfil.badges?.length || 0}</div>
                                <div style={styles.statLabel}>🏅 Logros</div>
                            </div>
                            <div style={styles.statItem}>
                                <div style={styles.statValue}>{perfil.spotsCreados}</div>
                                <div style={styles.statLabel}>Spots</div>
                            </div>
                        </div>
                    )}

                    {/* Barra de progreso al siguiente nivel */}
                    {levelInfo.next && (
                        <div style={styles.progressBar}>
                            <div style={styles.progressFill(progressToNext)}></div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div style={styles.tabs}>
                    <button style={styles.tab(activeTab === 'stats')} onClick={() => setActiveTab('stats')}>
                        📊 Stats
                    </button>
                    <button style={styles.tab(activeTab === 'badges')} onClick={() => setActiveTab('badges')}>
                        🎖️ Badges
                    </button>
                    <button style={styles.tab(activeTab === 'favoritos')} onClick={() => setActiveTab('favoritos')}>
                        ❤️ Favoritos
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {loading ? (
                        <div style={styles.emptyState}>Cargando...</div>
                    ) : (
                        <>
                            {/* Tab: Stats */}
                            {activeTab === 'stats' && perfil && (
                                <div className="stagger-children">
                                    <div style={styles.badgeCard}>
                                        <span style={styles.badgeIcon}>📍</span>
                                        <div style={styles.badgeInfo}>
                                            <div style={styles.badgeName}>Spots Creados</div>
                                            <div style={styles.badgeDesc}>{perfil.spotsCreados} lugares descubiertos</div>
                                        </div>
                                    </div>
                                    <div style={styles.badgeCard}>
                                        <span style={styles.badgeIcon}>🚨</span>
                                        <div style={styles.badgeInfo}>
                                            <div style={styles.badgeName}>Reportes</div>
                                            <div style={styles.badgeDesc}>{perfil.reportesHechos} alertas enviadas</div>
                                        </div>
                                    </div>
                                    <div style={styles.badgeCard}>
                                        <span style={styles.badgeIcon}>💬</span>
                                        <div style={styles.badgeInfo}>
                                            <div style={styles.badgeName}>Comentarios</div>
                                            <div style={styles.badgeDesc}>{perfil.comentariosHechos} comentarios</div>
                                        </div>
                                    </div>
                                    <div style={styles.badgeCard}>
                                        <span style={styles.badgeIcon}>🏆</span>
                                        <div style={styles.badgeInfo}>
                                            <div style={styles.badgeName}>Posición</div>
                                            <div style={styles.badgeDesc}>#{perfil.posicionLeaderboard} en el ranking</div>
                                        </div>
                                    </div>

                                    {/* 🔔 BOTÓN DE NOTIFICACIONES */}
                                    <div style={{ marginBottom: '15px' }}>
                                        <PushNotificationButton />
                                    </div>

                                    {/* 🔒 BOTÓN DE ADMIN PANEL (solo para admins) */}
                                    {user?.role === 'ADMIN' && (
                                        <button
                                            style={{
                                                ...styles.logoutBtn,
                                                background: 'rgba(139, 92, 246, 0.15)',
                                                color: '#8b5cf6',
                                                marginBottom: '10px',
                                                marginTop: 0
                                            }}
                                            onClick={() => {
                                                window.location.href = '/admin';
                                            }}
                                        >
                                            👑 Admin Panel
                                        </button>
                                    )}

                                    <button style={styles.logoutBtn} onClick={handleLogout}>
                                        🚪 Cerrar Sesión
                                    </button>
                                </div>
                            )}

                            {/* Tab: Badges */}
                            {activeTab === 'badges' && (
                                <div className="stagger-children">
                                    {perfil?.badges?.length > 0 ? (
                                        perfil.badges.map((badge, i) => (
                                            <div key={i} style={styles.badgeCard}>
                                                <span style={styles.badgeIcon}>{badge.icono || '🎖️'}</span>
                                                <div style={styles.badgeInfo}>
                                                    <div style={styles.badgeName}>{badge.nombre}</div>
                                                    <div style={styles.badgeDesc}>{badge.descripcion}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={styles.emptyState}>
                                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎯</div>
                                            <div>¡Sigue participando para desbloquear badges!</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab: Favoritos */}
                            {activeTab === 'favoritos' && (
                                <div className="stagger-children">
                                    {favoritos.length > 0 ? (
                                        favoritos.map((fav, i) => (
                                            <div key={i} style={styles.spotCard}>
                                                <span style={{ fontSize: '24px' }}>
                                                    {fav.spot?.estado === 'ROJO' ? '🔴' : '🟢'}
                                                </span>
                                                <div style={styles.spotInfo}>
                                                    <div style={styles.spotName}>{fav.spot?.nombre || 'Spot'}</div>
                                                    <div style={styles.spotStatus(fav.spot?.estado)}>
                                                        {fav.spot?.estado === 'ROJO' ? 'Peligro' : 'Relax'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={styles.emptyState}>
                                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💔</div>
                                            <div>Aún no tienes favoritos</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
