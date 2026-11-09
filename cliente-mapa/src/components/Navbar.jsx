import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiMap, HiFlag, HiShoppingBag, HiUser, HiSparkles } from 'react-icons/hi2';
import './navbar.css';

// Brújula (react-icons/hi2 no trae una)
const IconoBrujula = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </svg>
);

/**
 * 🧭 NAVBAR INFERIOR - Navegación principal de la app
 * 
 * Bottom bar con 5 tabs: Mapa, Explorar (Spots/Feed/Ranking), Misiones, Tienda, Perfil
 * + acceso flotante a la IA en el mapa (el resto vive en Perfil)
 */
const Navbar = ({ darkMode = false, onChatClick }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Tabs normales
    const tabs = [
        { path: '/', label: 'Mapa', icon: HiMap },
        { path: '/explorar', label: 'Explorar', icon: IconoBrujula },
        { path: '/misiones', label: 'Misiones', icon: HiFlag },
        { path: '/tienda', label: 'Tienda', icon: HiShoppingBag },
        { path: '/perfil', label: 'Perfil', icon: HiUser },
    ];

    return (
        <nav className={`navbar-bottom ${darkMode ? '' : 'light'}`}>
            {tabs.map((tab, index) => {
                const isActive = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
                const IconComponent = tab.icon;

                return (
                    <button
                        key={index}
                        className={`navbar-tab ${isActive ? 'active' : ''} ${tab.special ? 'special-tab' : ''}`}
                        onClick={() => {
                            if (tab.action === 'chat') {
                                onChatClick();
                            } else {
                                navigate(tab.path);
                            }
                        }}
                        aria-label={tab.label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <span className="navbar-tab-icon">
                            <IconComponent size={22} />
                        </span>
                        <span className="navbar-tab-label">{tab.label}</span>
                    </button>
                );
            })}
            {location.pathname === '/' && (
                <button
                    type="button"
                    className="navbar-ia-fab"
                    onClick={onChatClick}
                    aria-label="Abrir asistente de IA"
                >
                    <HiSparkles size={20} />
                </button>
            )}
        </nav>
    );
};

export default Navbar;
