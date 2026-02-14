import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HiArrowRightOnRectangle } from 'react-icons/hi2';

/**
 * 👤 BOTÓN DE USUARIO (Rediseño Premium + Responsivo)
 * 
 * - No logueado: muestra "Iniciar Sesión" en PC, solo ícono en celular
 * - Logueado: avatar circular con badge admin
 */
const UserButton = ({ darkMode, onLoginClick, onProfileClick }) => {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const styles = {
        loginButton: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0' : '8px',
            padding: isMobile ? '0' : '10px 18px',
            width: isMobile ? '40px' : 'auto',
            height: isMobile ? '40px' : 'auto',
            borderRadius: isMobile ? '12px' : '50px',
            backgroundColor: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            color: darkMode ? 'white' : '#333',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.25s ease',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            justifyContent: 'center'
        },
        loginIcon: {
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center'
        },
        profileButton: {
            width: isMobile ? '40px' : '52px',
            height: isMobile ? '40px' : '52px',
            borderRadius: '50%',
            backgroundColor: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            color: darkMode ? 'white' : '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.25s ease',
            position: 'relative',
            overflow: 'hidden',
            padding: 0
        },
        badge: {
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            fontSize: isMobile ? '10px' : '12px'
        }
    };

    if (!isAuthenticated) {
        return (
            <button
                onClick={onLoginClick}
                style={styles.loginButton}
                title="Iniciar Sesión"
            >
                <span style={styles.loginIcon}>
                    <HiArrowRightOnRectangle size={isMobile ? 18 : 20} />
                </span>
                {!isMobile && 'Iniciar Sesión'}
            </button>
        );
    }

    return (
        <button
            onClick={onProfileClick}
            style={styles.profileButton}
            title={user.username}
        >
            <img
                src={
                    (user.genero === 'mujer') ? '/icons/Mujer/Mujer.png' :
                        (user.genero === 'inclusive') ? '/icons/Inclusive/elle.png' :
                            '/icons/Hombre/Hombre.png'
                }
                alt="Avatar"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '100%',
                    transform: 'scale(1.0)'
                }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/icons/Hombre/Hombre.png'; }}
            />
            {isAdmin() && <span style={styles.badge}>👑</span>}
        </button>
    );
};

export default UserButton;
