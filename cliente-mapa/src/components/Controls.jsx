import React from 'react';
import { HiSun, HiMoon, HiMapPin, HiShieldExclamation, HiSparkles } from 'react-icons/hi2';

/**
 * 🎮 CONTROLES FLOTANTES (Rediseño Premium + Responsivo)
 * 
 * Panel de controles con diseño glassmorphism
 * Se adapta a celular y PC
 */
const Controls = ({ darkMode, setDarkMode, filter, setFilter, totalSpots }) => {
    const styles = {
        container: {
            position: 'absolute',
            top: '90px',
            right: '16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        },
        button: {
            backgroundColor: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            color: darkMode ? 'white' : '#333',
            padding: '12px',
            borderRadius: '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            fontSize: '16px',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s ease'
        },
        panel: {
            backgroundColor: darkMode ? 'var(--glass)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${darkMode ? 'var(--border-subtle)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            padding: '10px',
            minWidth: '120px'
        },
        panelTitle: {
            fontSize: '10px',
            fontWeight: '600',
            marginBottom: '8px',
            color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        },
        filterButton: (isActive, type) => ({
            width: '100%',
            backgroundColor: isActive
                ? (type === 'danger' ? 'rgba(255,68,68,0.2)' : 'rgba(0,200,81,0.2)')
                : 'transparent',
            color: isActive
                ? (type === 'danger' ? '#ef4444' : 'var(--accent)')
                : (darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'),
            border: isActive
                ? `1px solid ${type === 'danger' ? 'rgba(255,68,68,0.3)' : 'rgba(0,200,81,0.3)'}`
                : `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            padding: '8px 10px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: isActive ? '600' : '500',
            transition: 'all 0.2s ease',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        }),
        badge: {
            marginLeft: 'auto',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            padding: '2px 6px',
            borderRadius: '100px',
            fontSize: '10px',
            fontWeight: '600'
        }
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (isMobile) {
        styles.container.top = '95px'; // Bajado para no chocar con el reloj
        styles.container.right = '10px';
        styles.button.width = '40px';
        styles.button.height = '40px';
        styles.button.padding = '10px';
        styles.button.fontSize = '14px';
        styles.button.borderRadius = '12px';
        styles.panel.padding = '8px';
        styles.panel.minWidth = '110px';
        styles.panel.borderRadius = '12px';
    }

    return (
        <div style={styles.container}>
            {/* 🔍 Panel de filtros */}
            <div style={styles.panel}>
                <div style={styles.panelTitle}>Filtrar</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button
                        onClick={() => setFilter('ALL')}
                        style={styles.filterButton(filter === 'ALL', 'primary')}
                    >
                        <HiMapPin size={14} style={{ flexShrink: 0 }} /> Todos
                        <span style={styles.badge}>{totalSpots}</span>
                    </button>

                    <button
                        onClick={() => setFilter('ROJO')}
                        style={styles.filterButton(filter === 'ROJO', 'danger')}
                    >
                        <HiShieldExclamation size={14} style={{ flexShrink: 0 }} /> Tombo
                    </button>

                    <button
                        onClick={() => setFilter('VERDE')}
                        style={styles.filterButton(filter === 'VERDE', 'primary')}
                    >
                        <HiSparkles size={14} style={{ flexShrink: 0 }} /> Relax
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Controls;
