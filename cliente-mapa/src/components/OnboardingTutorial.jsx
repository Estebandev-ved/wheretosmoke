import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HiMap, HiRocketLaunch, HiFire, HiShoppingBag, HiUserGroup } from 'react-icons/hi2';
import { suscribir } from '../utils/eventosJuego';
import { reducirMovimiento } from '../utils/movimiento';
import './gamificacion.css';
import './onboarding.css';

/**
 * Tour inicial guiado por la mascota: 5 tarjetas deslizables (scroll-snap).
 * Se muestra solo la primera vez (localStorage 'hasSeenOnboarding') y se relanza
 * con emitir('tour:abrir') (botón "Ver tour de nuevo" del perfil).
 */

const LS_KEY = 'hasSeenOnboarding';

const PASOS = [
    { icono: HiMap, titulo: 'El mapa de spots', texto: 'Mira los spots cerca de ti, filtra por estado y toca uno para ver detalles, votar TOMBO o RELAX y dejar tu reseña.' },
    { icono: HiRocketLaunch, titulo: 'Explorar', texto: 'En Explorar encuentras spots sugeridos, el feed de la comunidad y el ranking de los parceros más activos.' },
    { icono: HiFire, titulo: 'Misiones y racha', texto: 'Haz check-in cada día para mantener tu racha, completa misiones y gana XP y monedas. ¡La llama crece con los días!' },
    { icono: HiShoppingBag, titulo: 'Tienda', texto: 'Gasta tus monedas en skins, marcos y mascotas. Tu mascota te acompaña en el mapa y reacciona a tus logros.' },
    { icono: HiUserGroup, titulo: 'Tu círculo de confianza', texto: 'Crea un círculo con tus parceros para compartir ubicación solo con quien tú elijas. Fume responsable y cuide el ambiente.' },
];

const yaVisto = () => {
    try { return localStorage.getItem(LS_KEY) === 'true'; } catch { return false; }
};
const marcarVisto = () => {
    try { localStorage.setItem(LS_KEY, 'true'); } catch { /* sin almacenamiento */ }
};

const OnboardingTutorial = ({ onComplete }) => {
    const [visible, setVisible] = useState(false);
    const [paso, setPaso] = useState(0);
    const pista = useRef(null);
    const siguienteRef = useRef(null);
    const pasoRef = useRef(0);
    useEffect(() => { pasoRef.current = paso; });

    // Primera vez: aparece tras un instante
    useEffect(() => {
        if (yaVisto()) return undefined;
        const t = setTimeout(() => { setPaso(0); setVisible(true); }, 600);
        return () => clearTimeout(t);
    }, []);

    // Relanzar desde el perfil
    useEffect(() => suscribir('tour:abrir', () => { setPaso(0); setVisible(true); }), []);

    const cerrar = useCallback(() => {
        marcarVisto();
        setVisible(false);
        onComplete?.();
    }, [onComplete]);

    const irA = useCallback((i) => {
        const el = pista.current;
        if (!el) return;
        el.scrollTo({ left: i * el.clientWidth, behavior: reducirMovimiento() ? 'auto' : 'smooth' });
        setPaso(i);
    }, []);

    const siguiente = () => (paso < PASOS.length - 1 ? irA(paso + 1) : cerrar());

    // Al deslizar con el dedo, sincroniza el indicador
    const alDeslizar = (e) => {
        const el = e.currentTarget;
        const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
        if (i !== paso) setPaso(i);
    };

    useEffect(() => {
        if (!visible) return undefined;
        siguienteRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') cerrar();
            else if (e.key === 'ArrowRight') irA(Math.min(PASOS.length - 1, pasoRef.current + 1));
            else if (e.key === 'ArrowLeft') irA(Math.max(0, pasoRef.current - 1));
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [visible, cerrar, irA]);

    if (!visible) return null;

    const ultimo = paso === PASOS.length - 1;

    return (
        <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-titulo">
            <div className="tour__panel">
                <div className="tour__top">
                    <span className="tour__paso" aria-live="polite">Paso {paso + 1} de {PASOS.length}</span>
                    <button type="button" className="tour__saltar" onClick={cerrar}>Saltar</button>
                </div>
                <div className="tour__barra" role="progressbar" aria-valuemin={1} aria-valuemax={PASOS.length} aria-valuenow={paso + 1} aria-label="Progreso del tour">
                    <span style={{ width: `${((paso + 1) / PASOS.length) * 100}%` }} />
                </div>

                <div className="tour__mascota">
                    <img src="/icons/bud_smoking.png" alt="" />
                    <span className="tour__saludo">{paso === 0 ? '¡Quihubo, parce! Yo te guío.' : ultimo ? '¡Ya está, a explorar!' : '¡Mire esto!'}</span>
                </div>

                <div className="tour__pista" ref={pista} onScroll={alDeslizar} tabIndex={0} aria-label="Pasos del tour, desliza para ver más">
                    {PASOS.map((p, i) => {
                        const Icono = p.icono;
                        return (
                            <section className="tour__tarjeta" key={p.titulo} aria-hidden={i !== paso} aria-roledescription="diapositiva">
                                <span className="tour__icono"><Icono size={28} aria-hidden="true" /></span>
                                <h2 id={i === paso ? 'tour-titulo' : undefined}>{p.titulo}</h2>
                                <p>{p.texto}</p>
                            </section>
                        );
                    })}
                </div>

                <div className="tour__puntos" aria-hidden="true">
                    {PASOS.map((p, i) => <span key={p.titulo} className={i === paso ? 'is-active' : ''} />)}
                </div>

                <div className="tour__acciones">
                    <button type="button" className="gm-btn" onClick={() => irA(Math.max(0, paso - 1))} disabled={paso === 0}>Atrás</button>
                    <button type="button" className="gm-btn gm-btn--primary" ref={siguienteRef} onClick={siguiente}>
                        {ultimo ? '¡Listo!' : 'Siguiente'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTutorial;
