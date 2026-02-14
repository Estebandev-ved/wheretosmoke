import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import RatingStars from './RatingStars';
import { useAuth } from '../context/AuthContext';
import { HiTrophy, HiChartBar, HiStar, HiMapPin, HiFire } from 'react-icons/hi2';

const API_URL = 'http://localhost:8081/api';

/**
 * 🏆 LEADERBOARD
 * 
 * Top usuarios con más puntos
 */
const Leaderboard = ({ darkMode = false, isOpen = false, onClose = () => { } }) => {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ranking');

    useEffect(() => {
        if (isOpen) {
            cargarDatos();
        }
    }, [isOpen]);

    const cargarDatos = async () => {
        try {
            const [leadRes, badgesRes] = await Promise.all([
                axios.get(`${API_URL}/gamificacion/leaderboard`),
                axios.get(`${API_URL}/gamificacion/badges`)
            ]);
            setLeaderboard(leadRes.data);
            setBadges(badgesRes.data);
        } catch (error) {
            console.error('Error cargando leaderboard:', error);
        }
        setLoading(false);
    };

    const getMedal = (position) => {
        if (position === 1) return '🥇';
        if (position === 2) return '🥈';
        if (position === 3) return '🥉';
        return `#${position}`;
    };

    const isMobile = window.innerWidth <= 768;

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 2000,
            display: isOpen ? 'flex' : 'none',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : '20px',
            paddingBottom: isMobile ? '60px' : '20px'
        },
        modal: {
            width: '100%',
            maxWidth: isMobile ? '100%' : '400px',
            maxHeight: isMobile ? '75vh' : '80vh',
            backgroundColor: darkMode ? '#1c1c1c' : 'white',
            borderRadius: isMobile ? '20px 20px 0 0' : '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        },
        header: {
            padding: '20px',
            backgroundColor: darkMode ? '#2c2c2c' : '#f5f5f5',
            textAlign: 'center',
            position: 'relative'
        },
        title: {
            fontSize: isMobile ? '20px' : '24px',
            margin: 0,
            color: darkMode ? 'white' : '#333'
        },
        tabs: {
            display: 'flex',
            borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`
        },
        tab: (active) => ({
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: active ? (darkMode ? '#333' : '#f5f5f5') : 'transparent',
            color: active ? (darkMode ? 'white' : '#333') : (darkMode ? '#666' : '#999'),
            cursor: 'pointer',
            fontWeight: active ? 'bold' : 'normal',
            fontSize: isMobile ? '13px' : '14px'
        }),
        content: {
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '12px' : '15px',
            WebkitOverflowScrolling: 'touch'
        },
        userCard: (isMe) => ({
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '12px',
            padding: isMobile ? '10px' : '12px',
            marginBottom: '10px',
            borderRadius: '12px',
            backgroundColor: isMe
                ? (darkMode ? 'rgba(0,200,81,0.2)' : '#e8f5e9')
                : (darkMode ? '#2c2c2c' : '#f5f5f5'),
            border: isMe ? '2px solid #00C851' : 'none'
        }),
        position: {
            fontSize: isMobile ? '18px' : '20px',
            width: isMobile ? '35px' : '40px',
            textAlign: 'center'
        },
        userInfo: {
            flex: 1,
            minWidth: 0
        },
        username: {
            fontWeight: 'bold',
            color: darkMode ? 'white' : '#333',
            fontSize: isMobile ? '13px' : '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        stats: {
            fontSize: isMobile ? '11px' : '12px',
            color: darkMode ? '#888' : '#666',
            display: 'flex',
            gap: isMobile ? '8px' : '10px',
            marginTop: '4px'
        },
        puntos: {
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: 'bold',
            color: '#FFD700',
            flexShrink: 0
        },
        badgeCard: {
            padding: isMobile ? '12px' : '15px',
            marginBottom: '10px',
            borderRadius: '12px',
            backgroundColor: darkMode ? '#2c2c2c' : '#f5f5f5'
        },
        badgeTitle: {
            fontSize: isMobile ? '14px' : '16px',
            marginBottom: '5px',
            color: darkMode ? 'white' : '#333'
        },
        badgeDesc: {
            fontSize: isMobile ? '12px' : '13px',
            color: darkMode ? '#888' : '#666'
        },
        closeBtn: {
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: darkMode ? '#888' : '#666',
            cursor: 'pointer'
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}><HiTrophy size={24} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#FFD700' }} /> Leaderboard</h2>
                    <button style={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div style={styles.tabs}>
                    <button style={styles.tab(activeTab === 'ranking')} onClick={() => setActiveTab('ranking')}>
                        <HiChartBar size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Top Fumetas
                    </button>
                    <button style={styles.tab(activeTab === 'badges')} onClick={() => setActiveTab('badges')}>
                        <HiStar size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Logros
                    </button>
                </div>

                <div style={styles.content}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>
                    ) : (
                        <>
                            {activeTab === 'ranking' && (
                                <>
                                    {leaderboard.map((u, i) => (
                                        <div key={i} style={styles.userCard(user?.id === u.usuarioId)}>
                                            <div style={styles.position}>{getMedal(i + 1)}</div>
                                            <div style={styles.userInfo}>
                                                <div style={styles.username}>{u.username}</div>
                                                <div style={styles.stats}>
                                                    <span><HiMapPin size={12} style={{ verticalAlign: 'middle' }} /> {u.spotsCreados} spots</span>
                                                    <span><HiFire size={12} style={{ verticalAlign: 'middle' }} /> {u.reportesHechos} aportes</span>
                                                </div>
                                            </div>
                                            <div style={styles.puntos}>{u.puntos} g</div>
                                        </div>
                                    ))}

                                    {leaderboard.length === 0 && (
                                        <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                                            ¡Sé el primero en aparecer!
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'badges' && (
                                <>
                                    {badges.map((badge, i) => (
                                        <div key={i} style={styles.badgeCard}>
                                            <div style={styles.badgeTitle}>{badge.nombre}</div>
                                            <div style={styles.badgeDesc}>{badge.descripcion}</div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Leaderboard;
