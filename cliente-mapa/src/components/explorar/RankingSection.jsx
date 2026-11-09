import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiArrowPath, HiTrophy } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { useGamificacion } from '../../hooks/useGamificacion';
import { getLeaderboard } from '../../services/gamificacionApi';
import CharacterAvatar from '../CharacterAvatar';
import AuthModal from '../AuthModal';

const pctXp = (u) => {
    const base = u.xpNivelActual ?? 0;
    const tope = u.xpSiguienteNivel;
    if (!tope) return 100;
    return Math.max(0, Math.min(100, (((u.puntos ?? 0) - base) / Math.max(1, tope - base)) * 100));
};

// El leaderboard puede traer `equipados` (categoria -> ruta de imagen); si no, el cogollo por defecto
const AvatarUsuario = ({ u, size, esYo, g }) => {
    if (esYo && g) {
        return (
            <CharacterAvatar
                size={size}
                skin={g.equipadosItems?.SKIN?.imagen}
                marco={g.equipadosItems?.MARCO}
                mascota={g.equipadosItems?.MASCOTA}
                alt={`Personaje de ${u.username}`}
            />
        );
    }
    return <CharacterAvatar size={size} skin={u.equipados?.SKIN} alt={`Personaje de ${u.username}`} />;
};

const Esqueleto = () => (
    <div className="ex-loading" aria-busy="true" aria-label="Cargando ranking">
        <div className="ex-podium">
            {[0, 1, 2].map((i) => <div key={i} className="gm-skel ex-skel-podio" />)}
        </div>
        <div className="gm-skel ex-skel-row" />
        <div className="gm-skel ex-skel-row" />
        <div className="gm-skel ex-skel-row" />
    </div>
);

const PUESTO = { 1: 'oro', 2: 'plata', 3: 'bronce' };

const Podio = ({ top, yoId, g }) => {
    // Orden visual: 2.º, 1.º, 3.º
    const orden = [top[1], top[0], top[2]].filter(Boolean);
    return (
        <ol className={`ex-podium ex-podium--${top.length}`} aria-label="Podio de los tres primeros">
            {orden.map((u) => {
                const pos = top.indexOf(u) + 1;
                const esYo = u.usuarioId === yoId;
                return (
                    <li key={u.usuarioId} className={`ex-pod ex-pod--${PUESTO[pos]} ${esYo ? 'is-me' : ''}`}>
                        <span className="ex-pod-rank" aria-label={`Puesto ${pos}`}>{pos}</span>
                        <div className="ex-pod-avatar">
                            {pos === 1 && <HiTrophy className="ex-pod-crown" size={22} aria-hidden="true" />}
                            <AvatarUsuario u={u} size={pos === 1 ? 76 : 62} esYo={esYo} g={g} />
                        </div>
                        <strong className="ex-pod-name">{u.username}{esYo ? ' (tú)' : ''}</strong>
                        <span className="ex-pod-lvl">Nv. {u.nivel ?? 1} · {u.tituloRango || 'Novato'}</span>
                        <span className="gm-chip ex-pod-xp">{u.puntos ?? 0} XP</span>
                    </li>
                );
            })}
        </ol>
    );
};

const RankingSection = () => {
    const { user } = useAuth();
    const g = useGamificacion();
    const [lista, setLista] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [showAuth, setShowAuth] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(false);
        try {
            const data = await getLeaderboard();
            setLista(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Error cargando ranking:', e);
            setError(true);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const ordenada = useMemo(() => lista.slice().sort((a, b) => (b.puntos ?? 0) - (a.puntos ?? 0)), [lista]);
    const yoId = g.perfil?.usuarioId;
    const miIndice = ordenada.findIndex((u) => (yoId != null && u.usuarioId === yoId) || (user?.username && u.username === user.username));
    const miPosicion = miIndice >= 0 ? miIndice + 1 : g.perfil?.posicionLeaderboard || null;

    if (cargando) return <Esqueleto />;

    if (error) {
        return (
            <div className="gm-card gm-state" role="alert">
                <img src="/icons/bud_angry.png" alt="" width="88" height="88" />
                <h2>No pudimos cargar el ranking</h2>
                <p>Revisa tu conexión e inténtalo otra vez.</p>
                <button type="button" className="gm-btn gm-btn--primary" onClick={cargar}>
                    <HiArrowPath size={16} aria-hidden="true" /> Reintentar
                </button>
            </div>
        );
    }

    if (ordenada.length === 0) {
        return (
            <div className="gm-card gm-state">
                <img src="/icons/bud_smoking.png" alt="" width="88" height="88" />
                <h2>El ranking está vacío</h2>
                <p>Reporta, comenta y sube fotos para ganar XP y aparecer aquí.</p>
            </div>
        );
    }

    const top = ordenada.slice(0, 3);
    const resto = ordenada.slice(3);
    const idDeMiFila = miIndice >= 0 ? ordenada[miIndice].usuarioId : null;
    const miId = user ? (yoId ?? idDeMiFila) : null;

    return (
        <div className="ex-stack">
            <Podio top={top} yoId={miId} g={g} />

            {resto.length > 0 && (
                <ol className="ex-rank" start={4} aria-label="Resto de la clasificación">
                    {resto.map((u, i) => {
                        const esYo = u.usuarioId === miId;
                        return (
                            <li key={u.usuarioId} className={`ex-rank-row ${esYo ? 'is-me' : ''}`}>
                                <span className="ex-rank-pos" aria-label={`Puesto ${i + 4}`}>{i + 4}</span>
                                <AvatarUsuario u={u} size={40} esYo={esYo} g={g} />
                                <div className="ex-rank-info">
                                    <strong>{u.username}{esYo ? ' (tú)' : ''}</strong>
                                    <span>Nv. {u.nivel ?? 1} · {u.tituloRango || 'Novato'}</span>
                                    <div className="gm-bar gm-bar--thin" aria-hidden="true"><span style={{ width: `${pctXp(u)}%` }} /></div>
                                </div>
                                <span className="ex-rank-xp">{u.puntos ?? 0} XP</span>
                            </li>
                        );
                    })}
                </ol>
            )}

            <div className="ex-me" aria-live="polite">
                {user && g.perfil ? (
                    <div className="ex-me-card">
                        <span className="ex-rank-pos">{miPosicion ?? '–'}</span>
                        <AvatarUsuario u={{ username: user.username }} size={40} esYo g={g} />
                        <div className="ex-rank-info">
                            <strong>Tu posición</strong>
                            <span>
                                {miPosicion ? `Puesto ${miPosicion}` : 'Aún sin puesto'} · Nv. {g.nivel} · {g.tituloRango}
                            </span>
                            <div className="gm-bar gm-bar--thin" aria-hidden="true">
                                <span style={{ width: `${pctXp({ puntos: g.xp, xpNivelActual: g.xpNivelActual, xpSiguienteNivel: g.xpSiguienteNivel })}%` }} />
                            </div>
                        </div>
                        <span className="ex-rank-xp">{g.xp} XP</span>
                    </div>
                ) : user ? (
                    <div className="ex-me-card"><span className="ex-me-txt">Cargando tu posición...</span></div>
                ) : (
                    <div className="ex-me-card">
                        <span className="ex-me-txt">Inicia sesión para ver tu posición.</span>
                        <button type="button" className="gm-btn gm-btn--primary gm-btn--sm" onClick={() => setShowAuth(true)}>Entrar</button>
                    </div>
                )}
            </div>

            {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode />, document.body)}
        </div>
    );
};

export default RankingSection;
