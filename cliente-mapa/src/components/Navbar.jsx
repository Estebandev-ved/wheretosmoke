import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiMap, HiPhoto, HiRocketLaunch, HiInformationCircle, HiSparkles } from 'react-icons/hi2';
import './navbar.css';

/**
 * 🧭 NAVBAR INFERIOR - Navegación principal de la app
 * 
 * Bottom bar con 4 tabs: Mapa, Feed, Descubrir, Nosotros
 * + 🤖 Botón de IA
 */
const Navbar = ({ darkMode = false, onChatClick }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Tabs normales
    const tabs = [
        { path: '/', label: 'Mapa', icon: HiMap },
        { path: '/feed', label: 'Feed', icon: HiPhoto },
        // Botón central de IA (Acción especial)
        { action: 'chat', label: 'IA', icon: HiSparkles, special: true },
        { path: '/descubrir', label: 'Descubrir', icon: HiRocketLaunch },
        { path: '/nosotros', label: 'Info', icon: HiInformationCircle },
    ];

    return (
        <nav className={`navbar-bottom ${darkMode ? '' : 'light'}`}>
            {tabs.map((tab, index) => {
                const isActive = tab.path ? location.pathname === tab.path : false;
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
                    >
                        <span className="navbar-tab-icon">
                            <IconComponent size={22} />
                        </span>
                        <span className="navbar-tab-label">{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default Navbar;
