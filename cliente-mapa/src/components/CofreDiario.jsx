import React, { useEffect, useRef, useState } from 'react';
import { HiClock, HiLockClosed } from 'react-icons/hi2';
import { useGamificacion } from '../hooks/useGamificacion';
import { useSegundosHasta, formatoReloj, proximaMedianocheBogota } from '../hooks/useEventoHoraFeliz';
import { useToast } from './WeedToast';
import { InsigniaX2 } from './HoraFeliz';
import { lanzarConfeti, COLORES_RAREZA, INTENSIDAD_RAREZA } from './fx/fxApi';
import { mensajeError } from '../services/gamificacionApi';
import { reducirMovimiento } from '../utils/movimiento';
import { resolveItemImage, RAREZAS } from '../utils/itemImage';
import { vibrar } from '../hooks/useHaptics';
import './gamificacion.css';
import './cofre-album.css';

/** Cofre dibujado en SVG (sin assets). estado: 'listo' | 'abriendo' | 'abierto' | 'gris' */
const CofreSvg = ({ estado }) => (
    <svg className={`cd-svg is-${estado}`} viewBox="0 0 120 104" aria-hidden="true" focusable="false">
        <defs>
            <linearGradient id="cd-madera" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#B9803F" /><stop offset="1" stopColor="#7A4B1E" />
            </linearGradient>
            <linearGradient id="cd-tapa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#CC9250" /><stop offset="1" stopColor="#94582A" />
            </linearGradient>
            <radialGradient id="cd-luz" cx="50%" cy="100%" r="80%">
                <stop offset="0" stopColor="#FFF6B0" stopOpacity="0.95" /><stop offset="1" stopColor="#FACC15" stopOpacity="0" />
            </radialGradient>
        </defs>
        <ellipse cx="60" cy="97" rx="46" ry="5" fill="#000" opacity="0.28" />
        <ellipse className="cd-luz" cx="60" cy="52" rx="44" ry="34" fill="url(#cd-luz)" />
        <g className="cd-cuerpo">
            <rect x="18" y="50" width="84" height="44" rx="7" fill="url(#cd-madera)" stroke="#4A2C10" strokeWidth="2" />
            <rect x="18" y="62" width="84" height="7" fill="#FACC15" opacity="0.9" />
            <rect x="30" y="50" width="8" height="44" fill="#FACC15" opacity="0.85" />
            <rect x="82" y="50" width="8" height="44" fill="#FACC15" opacity="0.85" />
        </g>
        <g className="cd-tapa">
            <path d="M16 54 Q16 20 60 20 Q104 20 104 54 Z" fill="url(#cd-tapa)" stroke="#4A2C10" strokeWidth="2" />
            <path d="M16 54 Q16 20 60 20 Q104 20 104 54" fill="none" stroke="#FACC15" strokeWidth="3" opacity="0.9" />
            <rect x="30" y="24" width="8" height="30" fill="#FACC15" opacity="0.8" />
            <rect x="82" y="24" width="8" height="30" fill="#FACC15" opacity="0.8" />
        </g>
        <g className="cd-cerradura">
            <rect x="51" y="51" width="18" height="17" rx="4" fill="#FACC15" stroke="#7A4B1E" strokeWidth="2" />
            <circle cx="60" cy="58" r="2.6" fill="#4A2C10" />
        </g>
    </svg>
);

const TextoPremio = ({ res }) => {
    if (res.tipo === 'MONEDAS') return <><strong className="cd-premio-num"><i className="gm-coin" aria-hidden="true" /> +{res.monedas} monedas</strong><span>Directo a tu saldo.</span></>;
    if (res.tipo === 'XP') return <><strong className="cd-premio-num">+{res.xp} XP</strong><span>Más cerca del siguiente nivel.</span></>;
    if (res.tipo === 'ARTICULO' && res.articulo) {
        const r = RAREZAS[res.articulo.rareza] || RAREZAS.COMUN;
        return (
            <>
                <strong className="cd-premio-num">{res.articulo.nombre}</strong>
                <span><span className={`gm-rarity gm-r-${r.clase}`}>{r.label}</span> ya está en tu colección.</span>
            </>
        );
    }
    return <strong className="cd-premio-num">¡Cofre abierto!</strong>;
};

/**
 * Cofre diario. Estados: invitado (invita a registrarse), listo (se sacude, tócalo),
 * abriendo → abierto (revela el premio) y gris (cuenta atrás hasta medianoche de Bogotá).
 * Si el backend no manda `cofreDisponible` no se muestra.
 */
const CofreDiario = ({ onLogin, compacto = false }) => {
    const g = useGamificacion();
    const toast = useToast();
    const { refresh, abrirCofre, aplicarCofre } = g;
    const [fase, setFase] = useState('idle'); // idle | abriendo | abierto
    const [res, setRes] = useState(null);
    const [medianoche, setMedianoche] = useState(() => proximaMedianocheBogota());
    const pendiente = useRef(null); // respuesta aún sin aplicar al estado global
    const timers = useRef([]);
    const btnRef = useRef(null);
    const aplicarRef = useRef(aplicarCofre);
    useEffect(() => { aplicarRef.current = aplicarCofre; });

    const disponible = g.cofreDisponible;
    const seg = useSegundosHasta(medianoche);

    // A medianoche (Bogotá) se renueva el cofre
    useEffect(() => {
        const id = setTimeout(() => {
            setMedianoche(proximaMedianocheBogota(Date.now() + 1000));
            refresh();
        }, Math.max(0, medianoche - Date.now()) + 500);
        return () => clearTimeout(id);
    }, [medianoche, refresh]);

    // Si se desmonta a mitad de la animación, el premio ya cobrado se aplica igual
    useEffect(() => () => {
        timers.current.forEach(clearTimeout);
        if (pendiente.current) { aplicarRef.current(pendiente.current); pendiente.current = null; }
    }, []);

    if (g.esInvitado) {
        return (
            <section className={`cd-card is-invitado${compacto ? ' is-compacto' : ''}`} aria-label="Cofre diario">
                <div className="cd-cofre is-gris"><CofreSvg estado="gris" /><HiLockClosed className="cd-candado" size={18} aria-hidden="true" /></div>
                <div className="cd-info">
                    <h2>Cofre diario</h2>
                    <p>Regístrate y abre un cofre gratis cada día con monedas, XP o artículos.</p>
                    <button type="button" className="gm-btn gm-btn--primary gm-btn--sm" onClick={onLogin}>Crear cuenta o iniciar sesión</button>
                </div>
            </section>
        );
    }
    if (disponible === undefined && fase === 'idle') return null; // backend sin cofre: no mostrar

    const rapido = reducirMovimiento();
    const esperar = (fn, ms) => { timers.current.push(setTimeout(fn, rapido ? 0 : ms)); };

    const abrir = async () => {
        if (fase !== 'idle' || !disponible) return;
        setFase('abriendo');
        vibrar('tap');
        const minimo = new Promise((ok) => esperar(ok, 800)); // el cofre se sacude antes de abrir
        let r;
        try {
            [r] = await Promise.all([abrirCofre(), minimo]);
            if (!r) throw new Error('sin respuesta');
        } catch (e) {
            toast.error(mensajeError(e, 'No pudimos abrir el cofre. Intenta de nuevo.'));
            setFase('idle');
            return;
        }
        if (r.yaAbierto) {
            toast.info('Ya abriste tu cofre de hoy. Vuelve mañana.');
            aplicarCofre(r);
            setFase('idle');
            return;
        }
        pendiente.current = r;
        setRes(r);
        setFase('abierto'); // la tapa salta
        esperar(() => {
            // Premio revelado: ahora sí cobra (monedas voladoras, confeti, perfil, evento 'cofre')
            const x = btnRef.current?.getBoundingClientRect();
            if (r.tipo === 'ARTICULO' && r.articulo?.rareza && r.articulo.rareza !== 'COMUN') {
                lanzarConfeti({
                    intensidad: INTENSIDAD_RAREZA[r.articulo.rareza] ?? 60,
                    colores: COLORES_RAREZA[r.articulo.rareza],
                    x: x ? x.left + x.width / 2 : undefined, y: x ? x.top + x.height / 2 : undefined,
                });
            }
            aplicarCofre(r);
            pendiente.current = null;
            if (r.multiplicador > 1) toast.success(`¡x${r.multiplicador} por hora feliz en tu cofre!`);
        }, 600);
    };

    const abierto = fase === 'abierto' && res;
    const gris = !abierto && fase === 'idle' && !disponible;
    const estado = abierto ? 'abierto' : fase === 'abriendo' ? 'abriendo' : gris ? 'gris' : 'listo';

    return (
        <section className={`cd-card is-${estado}${compacto ? ' is-compacto' : ''}`} aria-label="Cofre diario">
            <button
                ref={btnRef}
                type="button"
                className={`cd-cofre is-${estado}`}
                onClick={abrir}
                disabled={estado !== 'listo'}
                aria-label={estado === 'listo' ? 'Abrir cofre diario' : estado === 'gris' ? 'Cofre diario no disponible hasta mañana' : 'Cofre diario'}
            >
                <CofreSvg estado={estado} />
            </button>
            <div className="cd-info">
                <h2>Cofre diario <InsigniaX2 /></h2>
                {estado === 'listo' && (
                    <>
                        <p>¡Tienes un cofre sin abrir! Puede traer monedas, XP o un artículo.</p>
                        <button type="button" className="gm-btn gm-btn--gold gm-btn--sm" onClick={abrir}>Abrir cofre</button>
                    </>
                )}
                {estado === 'abriendo' && <p role="status">Abriendo el cofre…</p>}
                {estado === 'abierto' && (
                    <div className="cd-premio" role="status" aria-live="polite">
                        {res.tipo === 'ARTICULO' && res.articulo && (
                            <img className={`cd-premio-img gm-r-${(RAREZAS[res.articulo.rareza] || RAREZAS.COMUN).clase}`} src={resolveItemImage(res.articulo.imagen)} alt="" />
                        )}
                        <div className="cd-premio-txt">
                            <TextoPremio res={res} />
                            {res.multiplicador > 1 && <span className="cd-hf">¡x{res.multiplicador} por hora feliz!</span>}
                            <small><HiClock size={12} aria-hidden="true" /> Próximo cofre en {formatoReloj(seg)}</small>
                        </div>
                    </div>
                )}
                {estado === 'gris' && (
                    <>
                        <p>Ya abriste el de hoy. Vuelve a medianoche.</p>
                        <span className="cd-cuenta"><HiClock size={14} aria-hidden="true" /> <time role="timer" aria-label={`Faltan ${formatoReloj(seg)}`}>{formatoReloj(seg)}</time></span>
                    </>
                )}
            </div>
        </section>
    );
};

export default CofreDiario;
