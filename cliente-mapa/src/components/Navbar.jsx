import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiMap, HiPhoto, HiRocketLaunch, HiInformationCircle } from 'react-icons/hi2';
import './navbar.css';

/**
 * 🧭 NAVBAR INFERIOR - Navegación principal de la app
 * 
 * Bottom bar con 4 tabs: Mapa, Feed, Descubrir, Nosotros
 */
const Navbar = ({ darkMode = false }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const tabs = [
        { path: '/', label: 'Mapa', icon: HiMap },
        { path: '/feed', label: 'Feed', icon: HiPhoto },
        { path: '/descubrir', label: 'Descubrir', icon: HiRocketLaunch },
        { path: '/nosotros', label: 'Nosotros', icon: HiInformationCircle },
    ];

    return (
        <nav className={`navbar-bottom ${darkMode ? '' : 'light'}`}>
            {tabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                const IconComponent = tab.icon;

                return (
                    <button
                        key={tab.path}
                        className={`navbar-tab ${isActive ? 'active' : ''}`}
                        onClick={() => navigate(tab.path)}
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
