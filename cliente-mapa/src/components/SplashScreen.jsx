import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBoot, subscribeBoot } from '../services/bootStatus';
import './splash-screen.css';

const BOB = '/icons/bud_smoking.png';
const MIN_MS = 1200;
const TIMEOUT_MS = 6000;
const RADIUS = 78;
const CIRC = 2 * Math.PI * RADIUS;

const TIPS = [
    'Vota Relax o Tombo en cada spot: así la comunidad sabe cuáles están tranquilos y cuáles están calientes.',
    'Sube fotos de los spots. Entre más claras, más útil es la información para los demás.',
    'Crea círculos de confianza para ver y compartir spots solo con tu gente.',
    'Tu ubicación solo se usa para avisarte de alertas cercanas; no la mostramos a otros usuarios.',
    'Si un spot cambió, vuelve a votar: los votos se pueden rotar y mantienen el mapa al día.',
    'Activa las notificaciones para enterarte de alertas de Tombo cerca de ti.',
    'Guarda tus spots favoritos desde el detalle para encontrarlos rápido en tu perfil.',
    'Revisa los comentarios y el historial de un spot antes de ir.',
];

const BURST = Array.from({ length: 7 }, (_, i) => ({
    dx: Math.round(Math.cos((i / 7) * Math.PI * 2 - Math.PI / 2) * 70),
    dy: Math.round(Math.sin((i / 7) * Math.PI * 2 - Math.PI / 2) * 70) - 20,
    s: 14 + (i % 3) * 8,
}));

/**
 * Pantalla de carga interactiva. El progreso sale de hitos reales:
 * sesión verificada (AuthContext), mapa montado y primera carga de spots
 * (servicio bootStatus). Nunca llega a 100% antes de que esos hitos existan.
 */
const SplashScreen = ({ onDone }) => {
    const { loading: authLoading } = useAuth();
    const { pathname } = useLocation();
    const needsMap = pathname === '/';
    const [boot, setBoot] = useState(getBoot);
    const [elapsed, setElapsed] = useState(0);
    const [tipIndex, setTipIndex] = useState(0);
    const [taps, setTaps] = useState(0);
    const [bouncing, setBouncing] = useState(false);
    const [puffs, setPuffs] = useState([]);
    const [leaving, setLeaving] = useState(false);
    const start = useRef(0);
    const finished = useRef(false);

    useEffect(() => subscribeBoot(setBoot), []);

    useEffect(() => {
        start.current = performance.now();
        const id = setInterval(() => setElapsed(performance.now() - start.current), 100);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const id = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 3500);
        return () => clearInterval(id);
    }, []);

    const milestones = useMemo(() => {
        const list = [{ key: 'session', done: !authLoading, label: 'Verificando tu sesión' }];
        if (needsMap) {
            list.push({ key: 'map', done: boot.has('map'), label: 'Preparando el mapa' });
            list.push({ key: 'spots', done: boot.has('spots'), label: 'Cargando los spots' });
        }
        return list;
    }, [authLoading, boot, needsMap]);

    const doneCount = milestones.filter((m) => m.done).length;
    const allDone = doneCount === milestones.length;
    const timedOut = elapsed >= TIMEOUT_MS && !allDone;
    // Progreso honesto: cada hito aporta su parte; 100% solo si todo terminó.
    const real = (doneCount / milestones.length) * 100;
    const progress = allDone
        ? 100
        : Math.min(real + (elapsed / TIMEOUT_MS) * (100 / milestones.length) * 0.6, 96);
    const pct = Math.round(progress);

    const pending = milestones.find((m) => !m.done);
    const status = allDone
        ? '¡Todo listo!'
        : timedOut
            ? 'El servidor está tardando más de lo normal. Puedes continuar mientras termina de cargar.'
            : `${pending.label}...`;

    const finish = useCallback(() => {
        if (finished.current) return;
        finished.current = true;
        setLeaving(true);
        setTimeout(() => onDone && onDone(), 350);
    }, [onDone]);

    // Cierre cuando todos los hitos reales terminaron (respetando el mínimo visible)
    useEffect(() => {
        if (!allDone) return undefined;
        const wait = Math.max(0, MIN_MS - (performance.now() - start.current));
        const id = setTimeout(finish, wait);
        return () => clearTimeout(id);
    }, [allDone, finish]);

    // Salida de seguridad si el backend no responde
    useEffect(() => {
        const id = setTimeout(finish, TIMEOUT_MS + 1500);
        return () => clearTimeout(id);
    }, [finish]);

    const play = () => {
        setTaps((t) => t + 1);
        setBouncing(false);
        requestAnimationFrame(() => setBouncing(true));
        const id = Date.now() + Math.random();
        setPuffs((p) => [...p.slice(-3), id]);
        setTimeout(() => setPuffs((p) => p.filter((x) => x !== id)), 900);
    };

    return (
        <div className={`splash ${leaving ? 'splash--leaving' : ''}`} role="status" aria-live="polite" aria-label="Cargando Peguelo">
            <button type="button" className="splash-skip" onClick={finish} aria-label="Omitir pantalla de carga">
                Omitir
            </button>

            <header className="splash-head">
                <h1 className="splash-logo">Where<span>To</span>Smoke</h1>
                <span className="splash-pill">Medellín</span>
            </header>

            <div className="splash-stage">
                <svg className="splash-ring" viewBox="0 0 180 180" aria-hidden="true">
                    <circle cx="90" cy="90" r={RADIUS} className="splash-ring-track" />
                    <circle
                        cx="90" cy="90" r={RADIUS}
                        className="splash-ring-fill"
                        strokeDasharray={CIRC}
                        strokeDashoffset={CIRC * (1 - progress / 100)}
                    />
                </svg>
                <button
                    type="button"
                    className="splash-char-btn"
                    onClick={play}
                    aria-label="Tocar a Bob para jugar"
                >
                    <img
                        src={BOB}
                        alt=""
                        draggable="false"
                        className={`splash-char ${bouncing ? 'splash-char--bounce' : ''}`}
                        onAnimationEnd={() => setBouncing(false)}
                    />
                </button>
                {puffs.map((id) => (
                    <div className="splash-burst" key={id} aria-hidden="true">
                        {BURST.map((b, i) => (
                            <span
                                key={i}
                                className="splash-puff"
                                style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, width: b.s, height: b.s }}
                            />
                        ))}
                    </div>
                ))}
                <div className="splash-pct">{pct}%</div>
            </div>

            <p className="splash-play">
                Toca para jugar con Bob{taps > 0 && <strong> · {taps} {taps === 1 ? 'toque' : 'toques'}</strong>}
            </p>

            <div className="splash-bar" aria-hidden="true"><div style={{ width: `${progress}%` }} /></div>
            <p className="splash-status">{status}</p>

            <aside className="splash-tip" key={tipIndex}>
                <span className="splash-tip-title">Consejo de la comunidad</span>
                <p>{TIPS[tipIndex]}</p>
            </aside>
        </div>
    );
};

export default SplashScreen;
