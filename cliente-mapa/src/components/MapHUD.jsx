import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiTrophy, HiRocketLaunch, HiUserGroup, HiArrowsRightLeft, HiSun, HiMoon,
    HiViewfinderCircle, HiSquares2X2, HiXMark, HiUser, HiArrowRightOnRectangle,
    HiSpeakerWave, HiSpeakerXMark,
} from 'react-icons/hi2';
import { FaCoins } from 'react-icons/fa';
import SearchBar from './SearchBar';
import Controls from './Controls';
import DayNightClock from './DayNightClock';
import { useAuth } from '../context/AuthContext';
import { useGamificacion } from '../hooks/useGamificacion';
import { useCirculoActividad } from '../hooks/useCirculoActividad';
import { useGlobalSound } from '../context/SoundContext';
import LlamaRacha from './fx/LlamaRacha';
import MascotaCompanera from './fx/MascotaCompanera';
import { PildoraHoraFeliz, InsigniaX2, HoraFelizAviso } from './HoraFeliz';
import './map-hud.css';

/**
 * HUD del mapa: barra superior (busqueda + chips de gamificacion + filtros)
 * y pila de acciones a la derecha (ubicacion + menu "mas").
 * Toda la logica de negocio sigue viviendo en MapComponent; aqui solo se reciben callbacks.
 */
const MapHUD = ({
    darkMode, setDarkMode, mapRef,
    filter, setFilter, counts,
    onLocate, onToggleCircles, onToggleRoutes,
    circlesActive, routesActive,
    onLoginClick, onProfileClick,
}) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const gm = useGamificacion();
    const { soundEnabled, toggleSound } = useGlobalSound();
    const [menuOpen, setMenuOpen] = useState(false);
    const stackRef = useRef(null);
    const actividad = useCirculoActividad(isAuthenticated, user?.username, circlesActive);

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

    // Ordenado por frecuencia de uso: acciones principales arriba, ajustes abajo
    const abrirCirculos = () => (isAuthenticated ? onToggleCircles() : onLoginClick());
    const menuItems = [
        { key: 'circ', label: 'Círculos de confianza', icon: HiUserGroup, onClick: run(abrirCirculos), active: circlesActive },
        { key: 'rutas', label: 'Ruta de bajo perfil', icon: HiArrowsRightLeft, onClick: run(onToggleRoutes), active: routesActive },
        { key: 'rank', label: 'Ranking', icon: HiTrophy, onClick: run(() => navigate('/explorar?tab=ranking')) },
        { key: 'desc', label: 'Descubrir spots', icon: HiRocketLaunch, onClick: run(() => navigate('/explorar?tab=spots')) },
        { key: 'sep', separator: true },
        {
            key: 'sonido',
            label: soundEnabled ? 'Sonido activado' : 'Sonido desactivado',
            icon: soundEnabled ? HiSpeakerWave : HiSpeakerXMark,
            onClick: () => toggleSound(), // no cierra el menú: se ve el cambio al instante
            role: 'menuitemcheckbox', checked: soundEnabled,
        },
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
                            <button type="button" className="hud-chip hud-chip--level" onClick={() => navigate('/misiones')} aria-label={`Nivel ${gm.nivel}. Ver misiones${gm.cofreDisponible ? '. Tienes un cofre diario por abrir' : ''}`}>
                                <span>Nivel {gm.nivel}</span>
                                {gm.cofreDisponible && <i className="hud-chip__dot" aria-hidden="true" />}
                            </button>
                            <button type="button" className="hud-chip hud-chip--coins" data-fx-coins onClick={() => navigate('/tienda')} aria-label={`${gm.monedas} monedas. Ir a la tienda`}>
                                <FaCoins size={14} aria-hidden="true" />
                                <span>{gm.monedas}</span>
                                <InsigniaX2 />
                            </button>
                            <button
                                type="button"
                                className={`hud-chip hud-chip--streak${gm.checkinHoy ? ' is-done' : ''}`}
                                onClick={() => navigate('/misiones')}
                                aria-label={`Racha de ${gm.rachaDias} días. Ver misiones`}
                            >
                                <LlamaRacha dias={gm.rachaDias} size={16} />
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
                <PildoraHoraFeliz />
            </div>
            <HoraFelizAviso />

            <MascotaCompanera />

            <div className="map-hud hud-stack" ref={stackRef}>
                <button type="button" className="hud-fab" onClick={onLocate} aria-label="Ir a mi ubicación" title="Ir a mi ubicación">
                    <HiViewfinderCircle size={22} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className={`hud-pill${circlesActive ? ' is-open' : ''}`}
                    onClick={run(abrirCirculos)}
                    aria-label={
                        actividad.compartiendo > 0
                            ? `Mi círculo. ${actividad.compartiendo} ${actividad.compartiendo === 1 ? 'miembro comparte' : 'miembros comparten'} su ubicación`
                            : 'Mi círculo'
                    }
                    aria-haspopup="dialog"
                >
                    <HiUserGroup size={20} aria-hidden="true" />
                    <span>Mi círculo</span>
                    {actividad.compartiendo > 0 && (
                        <span className="hud-pill__badge" aria-hidden="true">{actividad.compartiendo}</span>
                    )}
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
                        {menuItems.map(({ key, label, icon, onClick, active, separator, role, checked }) => {
                            if (separator) return <div key={key} className="hud-menu__sep" role="separator" />;
                            const Icon = icon;
                            return (
                            <button
                                key={key}
                                type="button"
                                role={role || 'menuitem'}
                                aria-checked={checked}
                                className={`hud-menu__item${active ? ' is-active' : ''}`}
                                onClick={onClick}
                                aria-label={label}
                            >
                                <Icon size={20} aria-hidden="true" />
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
