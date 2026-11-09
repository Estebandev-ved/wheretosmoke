import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../AuthModal';
import ActividadAmigos from '../social/personas/ActividadAmigos';
import CarruselSugeridas from '../social/personas/CarruselSugeridas';
import ListaPersonas from '../social/personas/ListaPersonas';
import '../social/personas/personas.css';

const ORDENES = [
    { key: 'activos', label: 'Activos' },
    { key: 'nuevos', label: 'Nuevos' },
    { key: 'nivel', label: 'Nivel' },
];
// Comunas de Medellín (el filtro es texto exacto de la comuna que guarda el backend)
const COMUNAS = ['Popular', 'Santa Cruz', 'Manrique', 'Aranjuez', 'Castilla', 'Doce de Octubre', 'Robledo', 'Villa Hermosa', 'Buenos Aires', 'La Candelaria', 'Laureles-Estadio', 'La América', 'San Javier', 'El Poblado', 'Guayabal', 'Belén', 'San Sebastián de Palmitas', 'San Cristóbal', 'Altavista', 'San Antonio de Prado', 'Santa Elena'];

/** Pestaña Personas de Explorar: actividad, sugerencias y descubrimiento con búsqueda. */
const PersonasSection = ({ darkMode = true }) => {
    const { isAuthenticated, loading } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const [q, setQ] = useState('');
    const [qFinal, setQFinal] = useState('');
    const [orden, setOrden] = useState('activos');
    const [comuna, setComuna] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setQFinal(q.trim().length >= 2 ? q.trim() : ''), 350);
        return () => clearTimeout(t);
    }, [q]);

    if (!loading && !isAuthenticated) {
        return (
            <>
                <div className="gm-card gm-state">
                    <img src="/icons/bud_smoking.png" alt="" width="88" height="88" />
                    <h2>Conoce a la comunidad</h2>
                    <p>Inicia sesión para ver a tus amigos, encontrar gente nueva y enviar solicitudes.</p>
                    <button type="button" className="gm-btn gm-btn--primary" onClick={() => setShowAuth(true)}>Iniciar sesión o registrarme</button>
                </div>
                {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode />, document.body)}
            </>
        );
    }
    if (loading) return <div className="ex-loading" aria-busy="true"><div className="gm-skel ex-skel-row" /><div className="gm-skel ex-skel-row" /></div>;

    return (
        <div className="ex-stack">
            <ActividadAmigos darkMode={darkMode} />
            <CarruselSugeridas />
            <section className="pe-seccion" aria-label="Descubrir personas">
                <div className="gm-section-title"><h2>Descubrir personas</h2></div>
                <form className="am-buscador" role="search" onSubmit={(e) => e.preventDefault()}>
                    <HiMagnifyingGlass size={18} aria-hidden="true" />
                    <input
                        type="search" value={q} onChange={(e) => setQ(e.target.value)}
                        placeholder="Busca por nombre de usuario" aria-label="Buscar personas por nombre de usuario"
                        autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={40}
                    />
                    {q && <button type="button" className="am-limpiar" onClick={() => setQ('')} aria-label="Borrar búsqueda"><HiXMark size={16} aria-hidden="true" /></button>}
                </form>
                <div className="pe-filtros">
                    <div className="ex-chips" role="group" aria-label="Ordenar por">
                        {ORDENES.map((o) => (
                            <button key={o.key} type="button" className={`ex-chip ${orden === o.key ? 'is-active' : ''}`} aria-pressed={orden === o.key} onClick={() => setOrden(o.key)}>{o.label}</button>
                        ))}
                    </div>
                    <label className="pe-select">
                        <select value={comuna} onChange={(e) => setComuna(e.target.value)} aria-label="Filtrar por comuna">
                            <option value="">Todas las comunas</option>
                            {COMUNAS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                </div>
                <ListaPersonas params={{ q: qFinal, comuna, orden }} />
            </section>
        </div>
    );
};

export default PersonasSection;
