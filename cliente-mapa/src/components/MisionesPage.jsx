import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HiCheckCircle, HiFire, HiLockClosed, HiTrophy, HiClock, HiArrowPath, HiGift } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useGamificacion } from '../hooks/useGamificacion';
import { useGlobalSound } from '../context/SoundContext';
import { useParticles } from './ParticleEffects';
import { useToast } from './WeedToast';
import { createPortal } from 'react-dom';
import AuthModal from './AuthModal';
import { getMisiones, getLeaderboard, getBadges, mensajeError } from '../services/gamificacionApi';
import { resolveItemImage } from '../utils/itemImage';
import './gamificacion.css';
import './misiones.css';

const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const reducirMovimiento = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Cuenta atrás en segundos a partir de un valor inicial del backend. */
const useCuentaAtras = (segundos) => {
    const [st, setSt] = useState({ seg: segundos, val: segundos ?? 0 });
    if (st.seg !== segundos) setSt({ seg: segundos, val: segundos ?? 0 });
    useEffect(() => {
        if (segundos == null) return undefined;
        const fin = Date.now() + segundos * 1000;
        const id = setInterval(
            () => setSt({ seg: segundos, val: Math.max(0, Math.round((fin - Date.now()) / 1000)) }),
            1000
        );
        return () => clearInterval(id);
    }, [segundos]);
    return st.val;
};

const formatoTiempo = (s) => {
    if (s == null) return '';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const seg = s % 60;
    if (d > 0) return `${d} d ${h} h`;
    if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
    return `${m} min ${String(seg).padStart(2, '0')} s`;
};

/** Número que sube/baja suavemente hasta el valor final. */
const useNumeroAnimado = (valor) => {
    const [mostrado, setMostrado] = useState(valor);
    const previo = useRef(valor);
    useEffect(() => {
        const desde = previo.current;
        previo.current = valor;
        if (desde === valor) return undefined;
        if (reducirMovimiento()) {
            const id = requestAnimationFrame(() => setMostrado(valor));
            return () => cancelAnimationFrame(id);
        }
        const inicio = performance.now();
        let raf;
        const paso = (t) => {
            const p = Math.min(1, (t - inicio) / 900);
            setMostrado(Math.round(desde + (valor - desde) * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(paso);
        };
        raf = requestAnimationFrame(paso);
        return () => cancelAnimationFrame(raf);
    }, [valor]);
    return mostrado;
};

const SkeletonMisiones = () => (
    <div className="gm-wrap" aria-busy="true" aria-label="Cargando misiones">
        <div className="gm-skel" style={{ height: 150 }} />
        <div className="gm-skel" style={{ height: 130 }} />
        <div className="gm-skel" style={{ height: 92 }} />
        <div className="gm-skel" style={{ height: 92 }} />
        <div className="gm-skel" style={{ height: 92 }} />
    </div>
);

const TarjetaMision = ({ m, onReclamar, reclamando }) => {
    const pct = Math.min(100, Math.round((m.progreso / Math.max(1, m.meta)) * 100));
    return (
        <li className={`ms-mision ${m.completada ? 'is-done' : ''} ${m.reclamada ? 'is-claimed' : ''}`}>
            <div className="ms-mision-top">
                <div className="ms-mision-txt">
                    <h3>{m.titulo}</h3>
                    <p>{m.descripcion}</p>
                </div>
                <div className="ms-reward" aria-label="Recompensa">
                    <span className="gm-chip gm-chip--accent">+{m.recompensaXp} XP</span>
                    <span className="gm-chip gm-chip--gold"><i className="gm-coin" aria-hidden="true" />+{m.recompensaMonedas}</span>
                </div>
            </div>
            <div className="ms-mision-bottom">
                <div className="ms-prog">
                    <div className="gm-bar gm-bar--thin" role="progressbar" aria-valuemin={0} aria-valuemax={m.meta} aria-valuenow={Math.min(m.progreso, m.meta)} aria-label={`Progreso de ${m.titulo}`}>
                        <span style={{ width: `${pct}%` }} />
                    </div>
                    <small>{Math.min(m.progreso, m.meta)} / {m.meta}</small>
                </div>
                {m.reclamada ? (
                    <span className="ms-claimed"><HiCheckCircle size={16} aria-hidden="true" /> Reclamada</span>
                ) : (
                    <button
                        type="button"
                        className="gm-btn gm-btn--gold gm-btn--sm"
                        disabled={!m.completada || reclamando}
                        onClick={() => onReclamar(m)}
                        aria-label={m.completada ? `Reclamar recompensa de ${m.titulo}` : `${m.titulo}: aún no completada`}
                    >
                        {reclamando ? 'Reclamando…' : 'Reclamar'}
                    </button>
                )}
            </div>
        </li>
    );
};

const MisionesPage = ({ darkMode = true }) => {
    const { user, token } = useAuth();
    const g = useGamificacion();
    const { sounds } = useGlobalSound();
    const particles = useParticles();
    const toast = useToast();

    const [misiones, setMisiones] = useState(null);
    const [errorMis, setErrorMis] = useState(null);
    const [cargandoMis, setCargandoMis] = useState(false);
    const [ranking, setRanking] = useState(null);
    const [badges, setBadges] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const [reclamandoId, setReclamandoId] = useState(null);
    const [checkinBusy, setCheckinBusy] = useState(false);
    const [resCheckin, setResCheckin] = useState(null);
    const [subida, setSubida] = useState(null);
    const [flotante, setFlotante] = useState(null);

    const cargar = useCallback(async () => {
        setCargandoMis(true);
        setErrorMis(null);
        try {
            const [m, lb, bd] = await Promise.all([
                getMisiones(token),
                getLeaderboard().catch(() => []),
                getBadges().catch(() => []),
            ]);
            setMisiones(m);
            setRanking(lb);
            setBadges(bd);
        } catch (e) {
            setErrorMis(mensajeError(e, 'No pudimos cargar tus misiones.'));
        } finally {
            setCargandoMis(false);
        }
    }, [token]);

    useEffect(() => {
        if (user) cargar();
        else { setMisiones(null); setErrorMis(null); }
    }, [user, cargar]);

    const segDiario = useCuentaAtras(misiones?.segundosReinicioDiario);
    const segSemanal = useCuentaAtras(misiones?.segundosReinicioSemanal);
    const monedasAnim = useNumeroAnimado(g.monedas);

    const hacerCheckin = async () => {
        setCheckinBusy(true);
        try {
            const res = await g.hacerCheckin();
            setResCheckin(res);
            if (!res.yaHecho) {
                sounds.success();
                setFlotante(`+${res.monedasGanadas}`);
                setTimeout(() => setFlotante(null), 1600);
                toast.success(`Check-in listo: +${res.monedasGanadas} monedas y +${res.xpGanado} XP`);
                cargar();
            } else {
                toast.info('Ya hiciste tu check-in de hoy.');
            }
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCheckinBusy(false);
        }
    };

    const reclamar = async (m) => {
        setReclamandoId(m.id);
        try {
            const res = await g.reclamarMision(m.id);
            setMisiones((prev) => prev && {
                ...prev,
                diarias: prev.diarias.map((x) => (x.id === m.id ? { ...x, reclamada: true } : x)),
                semanales: prev.semanales.map((x) => (x.id === m.id ? { ...x, reclamada: true } : x)),
            });
            setFlotante(`+${res.monedasGanadas}`);
            setTimeout(() => setFlotante(null), 1600);
            if (res.subioNivel) {
                setSubida({ nivel: res.nivel });
                sounds.levelUp();
                particles.achievement();
            } else {
                sounds.success();
                toast.success(`Misión reclamada: +${res.xpGanado} XP y +${res.monedasGanadas} monedas`);
            }
        } catch (e) {
            toast.error(mensajeError(e));
            cargar();
        } finally {
            setReclamandoId(null);
        }
    };

    // Calendario de 7 días terminando hoy, derivado de la racha
    const semana = useMemo(() => {
        const hoy = new Date();
        const fin = g.checkinHoy ? 0 : 1; // si no hay check-in hoy la racha termina ayer
        return Array.from({ length: 7 }, (_, i) => {
            const atras = 6 - i;
            const f = new Date(hoy);
            f.setDate(hoy.getDate() - atras);
            const hecho = g.rachaDias > 0 && atras >= fin && atras < fin + g.rachaDias;
            return { etiqueta: DIAS[f.getDay()], nombre: DIAS_LARGO[f.getDay()], hoy: atras === 0, hecho };
        });
    }, [g.rachaDias, g.checkinHoy]);

    const mascota = g.equipadosItems?.MASCOTA;
    const personaje = mascota ? mascota.imagen : '/icons/bud_smoking.png';
    const xpBase = g.xpNivelActual ?? 0;
    const xpTope = g.xpSiguienteNivel;
    const pctXp = xpTope ? Math.max(0, Math.min(100, ((g.xp - xpBase) / Math.max(1, xpTope - xpBase)) * 100)) : 100;

    const ganadas = new Set(g.perfil?.badgesGanados || []);
    const top3 = useMemo(() => (ranking || []).slice().sort((a, b) => (b.puntos ?? 0) - (a.puntos ?? 0)), [ranking]);
    const miPosicion = useMemo(() => {
        if (g.perfil?.posicionLeaderboard) return g.perfil.posicionLeaderboard;
        const i = top3.findIndex((r) => r.usuarioId === g.perfil?.usuarioId);
        return i >= 0 ? i + 1 : null;
    }, [top3, g.perfil]);

    if (!user) {
        return (
            <main className="gm-page">
                <div className="gm-wrap">
                    <div className="gm-head"><div><h1>Misiones</h1><p className="gm-sub">Retos diarios y semanales para ganar XP y monedas.</p></div></div>
                    <div className="gm-card gm-state">
                        <img src="/icons/bud_smoking.png" alt="Bob, el cogollo" />
                        <h2>Inicia sesión para jugar</h2>
                        <p>Con tu cuenta puedes hacer check-in diario, completar misiones, subir de nivel y ganar monedas para la tienda.</p>
                        <button type="button" className="gm-btn gm-btn--primary" onClick={() => setShowAuth(true)}>Iniciar sesión o registrarme</button>
                    </div>
                </div>
                {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode={darkMode} />, document.body)}
            </main>
        );
    }

    if ((cargandoMis && !misiones) || (g.cargando && !g.perfil)) {
        return <main className="gm-page"><SkeletonMisiones /></main>;
    }

    if ((errorMis && !misiones) || (g.error && !g.perfil)) {
        return (
            <main className="gm-page">
                <div className="gm-wrap">
                    <div className="gm-card gm-state" role="alert">
                        <img src="/icons/bud_angry.png" alt="" />
                        <h2>No pudimos cargar las misiones</h2>
                        <p>{errorMis || g.error}</p>
                        <button type="button" className="gm-btn gm-btn--primary" onClick={() => { g.refresh(); cargar(); }}>
                            <HiArrowPath size={16} aria-hidden="true" /> Reintentar
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const diarias = misiones?.diarias || [];
    const semanales = misiones?.semanales || [];

    return (
        <main className="gm-page">
            <div className="gm-wrap">
                <div className="gm-head">
                    <div>
                        <h1>Misiones</h1>
                        <p className="gm-sub">Gana XP y monedas ayudando a la comunidad.</p>
                    </div>
                    <div className="ms-saldo" aria-live="polite">
                        <span className="gm-chip gm-chip--gold" aria-label={`Saldo: ${g.monedas} monedas`}>
                            <i className="gm-coin" aria-hidden="true" />{monedasAnim}
                        </span>
                        {flotante && <span className="ms-flotante gm-fly" aria-hidden="true">{flotante}</span>}
                    </div>
                </div>

                {/* Tarjeta de nivel */}
                <section className="gm-card ms-nivel" aria-label="Tu nivel">
                    <img className="ms-nivel-char" src={resolveItemImage(personaje)} alt={mascota ? `Tu mascota ${mascota.nombre}` : 'Bob, el cogollo'} />
                    <div className="ms-nivel-info">
                        <div className="ms-nivel-linea">
                            <span className="ms-nivel-num">Nivel {g.nivel}</span>
                            <span className="gm-chip gm-chip--accent">{g.tituloRango}</span>
                        </div>
                        <div className="gm-bar" role="progressbar" aria-valuemin={xpBase} aria-valuemax={xpTope || g.xp} aria-valuenow={g.xp} aria-label="Experiencia hacia el siguiente nivel">
                            <span style={{ width: `${pctXp}%` }} />
                        </div>
                        <small className="ms-xp">
                            {xpTope ? `${g.xp} / ${xpTope} XP (faltan ${Math.max(0, xpTope - g.xp)} para el nivel ${g.nivel + 1})` : `${g.xp} XP · nivel máximo`}
                        </small>
                    </div>
                </section>

                {/* Racha y check-in */}
                <section className="gm-card" aria-label="Racha diaria">
                    <div className="gm-section-title">
                        <span className="ms-racha"><HiFire size={20} aria-hidden="true" /> Racha de {g.rachaDias} {g.rachaDias === 1 ? 'día' : 'días'}</span>
                    </div>
                    <ol className="ms-semana">
                        {semana.map((d, i) => (
                            <li key={i} className={`${d.hecho ? 'is-done' : ''} ${d.hoy ? 'is-today' : ''}`} aria-label={`${d.nombre}${d.hoy ? ' (hoy)' : ''}: ${d.hecho ? 'check-in hecho' : 'sin check-in'}`}>
                                <span className="ms-dia-dot">{d.hecho ? <HiCheckCircle size={20} aria-hidden="true" /> : null}</span>
                                <span className="ms-dia-lbl">{d.etiqueta}</span>
                            </li>
                        ))}
                    </ol>
                    <button type="button" className="gm-btn gm-btn--primary gm-btn--block" onClick={hacerCheckin} disabled={g.checkinHoy || checkinBusy}>
                        <HiGift size={18} aria-hidden="true" />
                        {checkinBusy ? 'Registrando…' : g.checkinHoy ? 'Check-in de hoy hecho' : 'Hacer check-in diario'}
                    </button>
                    {resCheckin && !resCheckin.yaHecho && (
                        <p className="ms-feedback" role="status">
                            +{resCheckin.monedasGanadas} monedas y +{resCheckin.xpGanado} XP.
                            {typeof resCheckin.bonoManana === 'number' && resCheckin.bonoManana > 0 && ` Mañana ganas ${resCheckin.bonoManana} monedas si vuelves.`}
                        </p>
                    )}
                    {g.checkinHoy && !resCheckin && <p className="ms-feedback">Vuelve mañana para mantener tu racha.</p>}
                </section>

                {/* Diarias */}
                <section aria-label="Misiones diarias">
                    <div className="gm-section-title">
                        <h2>Misiones diarias</h2>
                        {misiones && <small className="ms-timer"><HiClock size={14} aria-hidden="true" /> Reinicia en {formatoTiempo(segDiario)}</small>}
                    </div>
                    {diarias.length === 0 ? (
                        <div className="gm-card gm-state"><p>No hay misiones diarias por ahora. Vuelve más tarde.</p></div>
                    ) : (
                        <ul className="ms-lista">{diarias.map((m) => <TarjetaMision key={m.id} m={m} onReclamar={reclamar} reclamando={reclamandoId === m.id} />)}</ul>
                    )}
                </section>

                {/* Semanales */}
                <section aria-label="Misiones semanales">
                    <div className="gm-section-title">
                        <h2>Misiones semanales</h2>
                        {misiones && <small className="ms-timer"><HiClock size={14} aria-hidden="true" /> Reinicia en {formatoTiempo(segSemanal)}</small>}
                    </div>
                    {semanales.length === 0 ? (
                        <div className="gm-card gm-state"><p>No hay misiones semanales por ahora.</p></div>
                    ) : (
                        <ul className="ms-lista">{semanales.map((m) => <TarjetaMision key={m.id} m={m} onReclamar={reclamar} reclamando={reclamandoId === m.id} />)}</ul>
                    )}
                </section>

                {/* Insignias */}
                <section aria-label="Insignias">
                    <div className="gm-section-title">
                        <h2>Insignias</h2>
                        {badges && <small>{badges.filter((b) => ganadas.has(b.id)).length} de {badges.length}</small>}
                    </div>
                    {!badges ? (
                        <div className="gm-skel" style={{ height: 90 }} />
                    ) : badges.length === 0 ? (
                        <div className="gm-card gm-state"><p>Aún no hay insignias disponibles.</p></div>
                    ) : (
                        <ul className="ms-badges">
                            {badges.map((b) => {
                                const ok = ganadas.has(b.id);
                                return (
                                    <li key={b.id} className={ok ? 'is-ok' : ''}>
                                        <span className="ms-badge-ico" aria-hidden="true">{ok ? <HiTrophy size={20} /> : <HiLockClosed size={18} />}</span>
                                        <span className="ms-badge-txt"><strong>{b.nombre}</strong><small>{b.descripcion}</small></span>
                                        <span className="gm-sr">{ok ? 'Ganada' : 'Bloqueada'}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* Ranking */}
                <section aria-label="Ranking">
                    <div className="gm-section-title"><h2>Ranking</h2><small>Top 3 por XP</small></div>
                    {!ranking ? (
                        <div className="gm-skel" style={{ height: 120 }} />
                    ) : top3.length === 0 ? (
                        <div className="gm-card gm-state"><p>El ranking aún está vacío.</p></div>
                    ) : (
                        <ol className="ms-rank">
                            {top3.slice(0, 3).map((r, i) => (
                                <li key={r.usuarioId} className={`${r.usuarioId === g.perfil?.usuarioId ? 'is-me' : ''} ms-rank-${i + 1}`}>
                                    <span className="ms-rank-pos">{i + 1}</span>
                                    <span className="ms-rank-name">{r.username}{r.usuarioId === g.perfil?.usuarioId ? ' (tú)' : ''}</span>
                                    <span className="ms-rank-xp">{r.puntos} XP</span>
                                </li>
                            ))}
                        </ol>
                    )}
                    <p className="ms-mipos">
                        {miPosicion ? `Estás en la posición ${miPosicion} con ${g.xp} XP.` : `Sigue sumando XP para entrar al ranking. Llevas ${g.xp} XP.`}
                    </p>
                </section>
            </div>

            {subida && (
                <div className="gm-modal" role="dialog" aria-modal="true" aria-labelledby="ms-lvl-title" onClick={() => setSubida(null)}>
                    <div className="gm-modal-card ms-lvl" onClick={(e) => e.stopPropagation()}>
                        <img src={resolveItemImage(personaje)} alt="" className="ms-lvl-char" />
                        <h2 id="ms-lvl-title">¡Subiste al nivel {subida.nivel}!</h2>
                        <p>Ahora eres <strong>{g.tituloRango}</strong>. Sigue ayudando a la comunidad para desbloquear más artículos en la tienda.</p>
                        <button type="button" className="gm-btn gm-btn--primary" autoFocus onClick={() => setSubida(null)}>Seguir jugando</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default MisionesPage;
