import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiTrophy, HiRocketLaunch, HiUserGroup, HiArrowsRightLeft, HiSun, HiMoon,
    HiViewfinderCircle, HiSquares2X2, HiXMark, HiFire, HiUser, HiArrowRightOnRectangle,
} from 'react-icons/hi2';
import { FaCoins } from 'react-icons/fa';
import SearchBar from './SearchBar';
import Controls from './Controls';
import DayNightClock from './DayNightClock';
import { useAuth } from '../context/AuthContext';
import { useGamificacion } from '../hooks/useGamificacion';
import './map-hud.css';

/**
 * HUD del mapa: barra superior (busqueda + chips de gamificacion + filtros)
 * y pila de acciones a la derecha (ubicacion + menu "mas").
 * Toda la logica de negocio sigue viviendo en MapComponent; aqui solo se reciben callbacks.
 */
const MapHUD = ({
    darkMode, setDarkMode, mapRef,
    filter, setFilter, counts,
    onLocate, onOpenLeaderboard, onOpenSugeridos, onToggleCircles, onToggleRoutes,
    circlesActive, routesActive,
    onLoginClick, onProfileClick,
}) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const gm = useGamificacion();
    const [menuOpen, setMenuOpen] = useState(false);
    const stackRef = useRef(null);

    // Cerrar el menu con Escape o al tocar fuera
    useEffect(() => {
        if (!menuOpen) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
        const onDown = (e) => {
            if (stackRef.current && !stackRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onDown);
        };
    }, [menuOpen]);

    const run = (fn) => () => { setMenuOpen(false); fn(); };

    const menuItems = [
        { key: 'rank', label: 'Ranking', icon: HiTrophy, onClick: run(onOpenLeaderboard) },
        { key: 'desc', label: 'Descubrir spots', icon: HiRocketLaunch, onClick: run(onOpenSugeridos) },
        { key: 'circ', label: 'Círculos de confianza', icon: HiUserGroup, onClick: run(onToggleCircles), active: circlesActive },
        { key: 'rutas', label: 'Rutas de bajo perfil', icon: HiArrowsRightLeft, onClick: run(onToggleRoutes), active: routesActive },
        { key: 'modo', label: darkMode ? 'Modo claro' : 'Modo oscuro', icon: darkMode ? HiSun : HiMoon, onClick: run(() => setDarkMode(!darkMode)) },
        isAuthenticated
            ? { key: 'perfil', label: 'Mi perfil', icon: HiUser, onClick: run(onProfileClick) }
            : { key: 'login', label: 'Iniciar sesión', icon: HiArrowRightOnRectangle, onClick: run(onLoginClick) },
    ];

    return (
        <>
            <div className="map-hud map-hud-top">
                <SearchBar darkMode={darkMode} mapRef={mapRef} embedded />

                <div className="hud-row" aria-label="Tu progreso">
                    {gm.esInvitado || !isAuthenticated ? (
                        <button type="button" className="hud-chip hud-chip--login" onClick={onLoginClick} aria-label="Iniciar sesión">
                            <HiArrowRightOnRectangle size={15} aria-hidden="true" />
                            <span>Inicia sesión</span>
                        </button>
                    ) : (
                        <>
                            <button type="button" className="hud-chip hud-chip--level" onClick={() => navigate('/misiones')} aria-label={`Nivel ${gm.nivel}. Ver misiones`}>
                                <span>Nivel {gm.nivel}</span>
                            </button>
                            <button type="button" className="hud-chip hud-chip--coins" onClick={() => navigate('/tienda')} aria-label={`${gm.monedas} monedas. Ir a la tienda`}>
                                <FaCoins size={14} aria-hidden="true" />
                                <span>{gm.monedas}</span>
                            </button>
                            <button
                                type="button"
                                className={`hud-chip hud-chip--streak${gm.checkinHoy ? ' is-done' : ''}`}
                                onClick={() => navigate('/misiones')}
                                aria-label={`Racha de ${gm.rachaDias} días. Ver misiones`}
                            >
                                <HiFire size={16} aria-hidden="true" />
                                <span>{gm.rachaDias}</span>
                            </button>
                            {user?.username && (
                                <button type="button" className="hud-chip hud-chip--user" onClick={onProfileClick} aria-label="Abrir mi perfil">
                                    <HiUser size={15} aria-hidden="true" />
                                    <span className="hud-chip__ellipsis">{user.username}</span>
                                </button>
                            )}
                        </>
                    )}
                    <DayNightClock compact darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />
                </div>

                <Controls filter={filter} setFilter={setFilter} counts={counts} />
            </div>

            <div className="map-hud hud-stack" ref={stackRef}>
                <button type="button" className="hud-fab" onClick={onLocate} aria-label="Ir a mi ubicación" title="Ir a mi ubicación">
                    <HiViewfinderCircle size={22} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className={`hud-fab${menuOpen ? ' is-open' : ''}`}
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label={menuOpen ? 'Cerrar menú de acciones' : 'Abrir menú de acciones'}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                >
                    {menuOpen ? <HiXMark size={22} aria-hidden="true" /> : <HiSquares2X2 size={22} aria-hidden="true" />}
                </button>
                {menuOpen && (
                    <div className="hud-menu" role="menu">
                        {menuItems.map(({ key, label, icon, onClick, active }) => {
                            const Icon = icon;
                            return (
                            <button
                                key={key}
                                type="button"
                                role="menuitem"
                                className={`hud-menu__item${active ? ' is-active' : ''}`}
                                onClick={onClick}
                                aria-label={label}
                            >
                                <Icon size={18} aria-hidden="true" />
                                <span>{label}</span>
                            </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default MapHUD;
