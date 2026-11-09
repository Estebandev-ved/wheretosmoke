import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    HiArrowLeft, HiArrowPath, HiPaperAirplane, HiArrowDown, HiExclamationCircle, HiCheck,
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import useMensajes from '../../hooks/useMensajes';
import useHaptics from '../../hooks/useHaptics';
import AuthModal from '../AuthModal';
import AvatarUsuario from './AvatarUsuario';
import {
    getPerfilPublico, getMensajes, enviarMensaje, marcarLeido, mensajeError, estadoHttp,
} from '../../services/amigosApi';
import { claveDia, etiquetaDia, horaCorta } from '../../utils/social';
import '../gamificacion.css';
import './social-usuarios.css';

const MAX = 500;
const LIMITE = 30;
const SONDEO_MS = 15000;
const GRUPO_MS = 5 * 60 * 1000;

const ordenar = (lista) => lista.slice().sort((a, b) => {
    if (a.tmp !== b.tmp) return a.tmp ? 1 : -1; // los pendientes siempre al final
    if (a.tmp) return 0;
    return a.id - b.id;
});

/** Mezcla mensajes del servidor (últimos N) con los que ya hay: añade nuevos y actualiza `leido`. */
const mezclar = (previos, servidor) => {
    const porId = new Map(previos.filter((m) => !m.tmp).map((m) => [m.id, m]));
    servidor.forEach((s) => { porId.set(s.id, { ...porId.get(s.id), ...s }); });
    return ordenar([...porId.values(), ...previos.filter((m) => m.tmp)]);
};

const ChatConversacion = () => {
    const { id } = useParams();
    const otroId = Number(id);
    const navigate = useNavigate();
    const { isAuthenticated, loading: authCargando } = useAuth();
    const { suscribir, conectado, setActiva, refrescar } = useMensajes();
    const haptics = useHaptics();

    const [otro, setOtro] = useState(null);
    const [msgs, setMsgs] = useState([]);
    const [hayMas, setHayMas] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [fallo, setFallo] = useState(null); // {codigo, mensaje}
    const [texto, setTexto] = useState('');
    const [nuevosAbajo, setNuevosAbajo] = useState(0);
    const [anuncio, setAnuncio] = useState('');
    const [showAuth, setShowAuth] = useState(false);

    const raizRef = useRef(null);
    const listaRef = useRef(null);
    const areaRef = useRef(null);
    const pegadoRef = useRef(true);        // ¿el usuario está leyendo lo último?
    const ajusteRef = useRef(null);        // {altura} al anteponer mensajes antiguos
    const contadorTmp = useRef(0);
    const otroRef = useRef(null);
    const msgsRef = useRef([]);
    useEffect(() => { otroRef.current = otro; }, [otro]);
    useEffect(() => { msgsRef.current = msgs; }, [msgs]);

    const esAmigo = otro?.estadoAmistad === 'AMIGOS';

    // ───── carga inicial ─────
    const cargarInicial = useCallback(async () => {
        setCargando(true);
        setFallo(null);
        const [p, m] = await Promise.allSettled([getPerfilPublico(otroId), getMensajes(otroId, { limite: LIMITE })]);
        if (p.status === 'fulfilled') setOtro(p.value);
        else setFallo({ codigo: estadoHttp(p.reason), mensaje: mensajeError(p.reason, 'No pudimos abrir esta conversación.') });
        if (m.status === 'fulfilled') {
            pegadoRef.current = true;
            setMsgs(ordenar(m.value?.mensajes || []));
            setHayMas(!!m.value?.hayMas);
        } else if (p.status === 'fulfilled') {
            // Perfil ok pero sin mensajes (p. ej. 403 si no son amigos): se informa en la barra de entrada
            setMsgs([]);
            setHayMas(false);
            if (estadoHttp(m.reason) !== 403) setFallo({ codigo: estadoHttp(m.reason), mensaje: mensajeError(m.reason, 'No pudimos cargar los mensajes.') });
        }
        setCargando(false);
    }, [otroId]);

    useEffect(() => {
        if (!isAuthenticated || Number.isNaN(otroId)) return;
        cargarInicial();
    }, [isAuthenticated, otroId, cargarInicial]);

    // ───── conversación activa (sin toast ni suma de no leídos) ─────
    useEffect(() => {
        setActiva(otroId);
        return () => setActiva(null);
    }, [otroId, setActiva]);

    // ───── marcar como leído ─────
    // Agrupa ráfagas (varios mensajes seguidos) en una sola petición
    const leerTimer = useRef(null);
    const leer = useCallback(() => {
        if (document.visibilityState !== 'visible') return;
        clearTimeout(leerTimer.current);
        leerTimer.current = setTimeout(() => {
            marcarLeido(otroId).then(() => refrescar()).catch(() => {});
        }, 350);
    }, [otroId, refrescar]);
    useEffect(() => () => clearTimeout(leerTimer.current), []);

    useEffect(() => {
        if (cargando || !esAmigo) return undefined;
        leer();
        const alVolver = () => leer();
        document.addEventListener('visibilitychange', alVolver);
        return () => document.removeEventListener('visibilitychange', alVolver);
    }, [cargando, esAmigo, leer]);

    // ───── tiempo real ─────
    const anunciarEntrante = useCallback((m) => {
        const nombre = otroRef.current?.username || 'Tu amigo';
        setAnuncio(`Mensaje nuevo de ${nombre}: ${m.texto}`);
        if (pegadoRef.current) return;
        setNuevosAbajo((n) => n + 1);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return undefined;
        return suscribir((ev) => {
            if (ev.tipo === 'leido') {
                if (Number(ev.deId) !== otroId) return;
                setMsgs((prev) => prev.map((m) => (m.tmp || m.leido ? m : { ...m, leido: true })));
                return;
            }
            const deOtro = Number(ev.deId) === otroId;
            const paraOtro = Number(ev.paraId) === otroId;
            if (!deOtro && !paraOtro) return;
            const actual = msgsRef.current;
            if (actual.some((m) => !m.tmp && m.id === ev.id)) return;
            if (paraOtro && actual.some((m) => m.tmp && m.texto === ev.texto)) return; // eco de lo que envío ahora
            setMsgs((prev) => (prev.some((m) => !m.tmp && m.id === ev.id) ? prev : ordenar([...prev, ev])));
            if (deOtro) {
                anunciarEntrante(ev);
                leer();
            }
        });
    }, [isAuthenticated, otroId, suscribir, anunciarEntrante, leer]);

    // ───── respaldo: sondeo cada 15 s si no hay socket, y resincronizar al reconectar ─────
    const sincronizar = useCallback(async () => {
        try {
            const d = await getMensajes(otroId, { limite: LIMITE });
            const del = d?.mensajes || [];
            const conocidos = new Set(msgsRef.current.filter((m) => !m.tmp).map((m) => m.id));
            const entrantes = del.filter((m) => !conocidos.has(m.id) && Number(m.deId) === otroId).length;
            setMsgs((prev) => mezclar(prev, del));
            if (entrantes > 0) {
                anunciarEntrante({ texto: entrantes === 1 ? 'tienes un mensaje nuevo' : `tienes ${entrantes} mensajes nuevos` });
                leer();
            }
        } catch { /* se reintenta en el próximo ciclo */ }
    }, [otroId, anunciarEntrante, leer]);

    useEffect(() => {
        if (!isAuthenticated || cargando || !esAmigo) return undefined;
        if (conectado) { sincronizar(); return undefined; }
        const idt = setInterval(sincronizar, SONDEO_MS);
        return () => clearInterval(idt);
    }, [isAuthenticated, cargando, esAmigo, conectado, sincronizar]);

    // ───── scroll ─────
    const bajar = useCallback((suave = false) => {
        const el = listaRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: suave && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
    }, []);

    useLayoutEffect(() => {
        const el = listaRef.current;
        if (!el) return;
        if (ajusteRef.current) {
            el.scrollTop += el.scrollHeight - ajusteRef.current.altura;
            ajusteRef.current = null;
        } else if (pegadoRef.current) {
            el.scrollTop = el.scrollHeight;
        }
    }, [msgs, cargando]);

    const alHacerScroll = () => {
        const el = listaRef.current;
        if (!el) return;
        const pegado = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        pegadoRef.current = pegado;
        if (pegado) setNuevosAbajo(0);
    };

    // Teclado móvil: la raíz sigue al viewport visual para que la barra de entrada nunca quede tapada
    useEffect(() => {
        const vv = window.visualViewport;
        const el = raizRef.current;
        if (!vv || !el) return undefined;
        const ajustar = () => {
            el.style.height = `${vv.height}px`;
            el.style.top = `${vv.offsetTop}px`;
            if (pegadoRef.current) bajar();
        };
        ajustar();
        vv.addEventListener('resize', ajustar);
        vv.addEventListener('scroll', ajustar);
        return () => {
            vv.removeEventListener('resize', ajustar);
            vv.removeEventListener('scroll', ajustar);
        };
    }, [bajar]);

    // Impedir que el fondo (la página) se desplace por detrás del chat
    useEffect(() => {
        const prev = document.documentElement.style.overscrollBehavior;
        document.documentElement.style.overscrollBehavior = 'none';
        return () => { document.documentElement.style.overscrollBehavior = prev; };
    }, []);

    // ───── mensajes anteriores ─────
    const verMas = async () => {
        const primero = msgs.find((m) => !m.tmp);
        if (!primero || cargandoMas) return;
        setCargandoMas(true);
        try {
            const d = await getMensajes(otroId, { antes: primero.id, limite: LIMITE });
            ajusteRef.current = { altura: listaRef.current?.scrollHeight ?? 0 };
            setMsgs((prev) => mezclar(prev, d?.mensajes || []));
            setHayMas(!!d?.hayMas);
        } catch (e) {
            setAnuncio(mensajeError(e, 'No pudimos cargar los mensajes anteriores.'));
        } finally {
            setCargandoMas(false);
        }
    };

    // ───── enviar ─────
    const autoajustar = useCallback(() => {
        const a = areaRef.current;
        if (!a) return;
        a.style.height = 'auto';
        a.style.height = `${Math.min(a.scrollHeight, 120)}px`;
    }, []);
    useLayoutEffect(() => { autoajustar(); }, [texto, autoajustar]);

    const transmitir = useCallback(async (tmpId, t) => {
        try {
            const real = await enviarMensaje(otroId, t);
            setMsgs((prev) => {
                const sinTmp = prev.filter((m) => m.id !== tmpId);
                if (sinTmp.some((m) => !m.tmp && m.id === real.id)) return sinTmp; // el eco por socket llegó antes
                return ordenar([...sinTmp, real]);
            });
        } catch (e) {
            setMsgs((prev) => prev.map((m) => (m.id === tmpId ? { ...m, estado: 'error', error: mensajeError(e, 'No se pudo enviar.') } : m)));
        }
    }, [otroId]);

    const enviar = () => {
        const t = texto.trim();
        if (!t || t.length > MAX || !esAmigo) return;
        const tmpId = `tmp-${Date.now()}-${++contadorTmp.current}`;
        pegadoRef.current = true;
        setMsgs((prev) => ordenar([...prev, { id: tmpId, tmp: true, deId: 'yo', paraId: otroId, texto: t, fecha: new Date().toISOString(), estado: 'enviando', leido: false }]));
        setTexto('');
        haptics.tap();
        transmitir(tmpId, t);
        areaRef.current?.focus();
    };

    const reintentar = (m) => {
        setMsgs((prev) => prev.map((x) => (x.id === m.id ? { ...x, estado: 'enviando', error: null } : x)));
        transmitir(m.id, m.texto);
    };
    const descartar = (m) => setMsgs((prev) => prev.filter((x) => x.id !== m.id));

    const alTeclear = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            enviar();
        }
    };

    // ───── derivados para pintar ─────
    const esMio = useCallback((m) => Number(m.deId) !== otroId, [otroId]);

    const items = useMemo(() => {
        const out = [];
        let dia = null;
        msgs.forEach((m, i) => {
            const k = claveDia(m.fecha);
            if (k !== dia) { out.push({ tipo: 'dia', key: `d-${k}`, etiqueta: etiquetaDia(m.fecha) }); dia = k; }
            const ant = msgs[i - 1];
            const sig = msgs[i + 1];
            const cerca = (a, b) => a && b && claveDia(a.fecha) === claveDia(b.fecha) && esMio(a) === esMio(b) && Math.abs(new Date(b.fecha) - new Date(a.fecha)) < GRUPO_MS;
            out.push({ tipo: 'msg', key: m.id, m, inicio: !cerca(ant, m), fin: !cerca(m, sig) });
        });
        return out;
    }, [msgs, esMio]);

    const ultimoMio = useMemo(() => {
        for (let i = msgs.length - 1; i >= 0; i -= 1) if (esMio(msgs[i])) return msgs[i];
        return null;
    }, [msgs, esMio]);

    // ───── estados de pantalla ─────
    const volver = () => (window.history.length > 1 ? navigate(-1) : navigate('/chat'));
    const Cabecera = (
        <header className="ch-head">
            <button type="button" className="pu-icon" onClick={volver} aria-label="Volver">
                <HiArrowLeft size={20} aria-hidden="true" />
            </button>
            {otro ? (
                <>
                    <Link to={`/usuario/${otro.id}`} className="ch-head__who" aria-label={`Ver perfil de ${otro.username}`}>
                        <AvatarUsuario usuario={otro} size={40} />
                        <span className="am-info">
                            <strong>{otro.username}</strong>
                            <small>Nv. {otro.nivel ?? 1} · {otro.tituloRango || 'Novato'}</small>
                        </span>
                    </Link>
                    <span className={`ch-live${conectado ? ' is-on' : ''}`} role="status">
                        <i aria-hidden="true" />{conectado ? 'En vivo' : 'Reconectando…'}
                    </span>
                </>
            ) : (
                <strong className="ch-head__tit">Mensajes</strong>
            )}
        </header>
    );

    const pantalla = (contenido) => (
        <div className="ch-root" ref={raizRef}>
            <div className="ch-col">
                {Cabecera}
                <div className="ch-estado">{contenido}</div>
            </div>
        </div>
    );

    if (Number.isNaN(otroId)) {
        return pantalla(
            <div className="gm-card gm-state" role="alert">
                <img src="/icons/bud_map.png" alt="" width="88" height="88" />
                <h2>Conversación no válida</h2>
                <Link to="/chat" className="gm-btn gm-btn--primary">Ver mis mensajes</Link>
            </div>
        );
    }

    if (!authCargando && !isAuthenticated) {
        return (
            <>
                {pantalla(
                    <div className="gm-card gm-state">
                        <img src="/icons/bud_smoking.png" alt="" width="88" height="88" />
                        <h2>Entra para chatear</h2>
                        <p>Inicia sesión para escribirle a tus amigos.</p>
                        <button type="button" className="gm-btn gm-btn--primary" onClick={() => setShowAuth(true)}>Iniciar sesión o registrarme</button>
                    </div>
                )}
                {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode />, document.body)}
            </>
        );
    }

    if (fallo && !otro) {
        const noExiste = fallo.codigo === 404;
        return pantalla(
            <div className="gm-card gm-state" role="alert">
                <img src={noExiste ? '/icons/bud_map.png' : '/icons/bud_angry.png'} alt="" width="88" height="88" />
                <h2>{noExiste ? 'No encontramos a esta persona' : 'No pudimos abrir el chat'}</h2>
                <p>{noExiste ? 'Puede que ya no esté en la app.' : fallo.mensaje}</p>
                {noExiste
                    ? <Link to="/chat" className="gm-btn gm-btn--primary">Ver mis mensajes</Link>
                    : <button type="button" className="gm-btn gm-btn--primary" onClick={cargarInicial}><HiArrowPath size={16} aria-hidden="true" /> Reintentar</button>}
            </div>
        );
    }

    const restantes = MAX - texto.length;

    return (
        <div className="ch-root" ref={raizRef}>
            <div className="ch-col">
                {Cabecera}

                <div className="gm-sr" role="status" aria-live="polite">{anuncio}</div>

                <div className="ch-lista" ref={listaRef} onScroll={alHacerScroll}>
                    {cargando ? (
                        <div className="ch-cargando" aria-busy="true" aria-label="Cargando mensajes">
                            <div className="gm-skel ch-skel ch-skel--otro" />
                            <div className="gm-skel ch-skel ch-skel--mio" />
                            <div className="gm-skel ch-skel ch-skel--otro" />
                        </div>
                    ) : (
                        <>
                            {hayMas && (
                                <div className="ch-mas">
                                    <button type="button" className="gm-btn gm-btn--sm" onClick={verMas} disabled={cargandoMas}>
                                        {cargandoMas ? 'Cargando…' : 'Ver mensajes anteriores'}
                                    </button>
                                </div>
                            )}
                            {msgs.length === 0 ? (
                                <div className="ch-vacio">
                                    <img src="/icons/bud_smoking.png" alt="" width="84" height="84" />
                                    <p>{esAmigo ? `Rompe el hielo con ${otro?.username}. Escribe el primer mensaje.` : 'Aún no hay mensajes.'}</p>
                                </div>
                            ) : (
                                <ol className="ch-msgs" role="log" aria-label={`Conversación con ${otro?.username ?? ''}`} aria-live="off">
                                    {items.map((it) => {
                                        if (it.tipo === 'dia') {
                                            return <li key={it.key} className="ch-dia"><span>{it.etiqueta}</span></li>;
                                        }
                                        const { m } = it;
                                        const mio = esMio(m);
                                        return (
                                            <li
                                                key={it.key}
                                                className={`ch-msg ${mio ? 'ch-msg--mio' : 'ch-msg--otro'}${it.inicio ? ' is-ini' : ''}${it.fin ? ' is-fin' : ''}${m.estado === 'error' ? ' is-error' : ''}${m.estado === 'enviando' ? ' is-env' : ''}`}
                                            >
                                                <div className="ch-bubble">
                                                    <p className="ch-texto">{m.texto}</p>
                                                    {it.fin && <span className="ch-hora">{horaCorta(m.fecha)}</span>}
                                                </div>
                                                {m.estado === 'error' && (
                                                    <div className="ch-fallo" role="alert">
                                                        <HiExclamationCircle size={14} aria-hidden="true" />
                                                        <span>{m.error || 'No se envió.'}</span>
                                                        <button type="button" onClick={() => reintentar(m)}>Reintentar</button>
                                                        <button type="button" onClick={() => descartar(m)}>Descartar</button>
                                                    </div>
                                                )}
                                                {mio && m === ultimoMio && m.estado !== 'error' && (
                                                    <span className="ch-visto">
                                                        {m.estado === 'enviando' ? 'Enviando…' : m.leido ? (<><HiCheck size={12} aria-hidden="true" /> Visto</>) : 'Enviado'}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                        </>
                    )}
                </div>

                {nuevosAbajo > 0 && (
                    <button type="button" className="ch-nuevo" onClick={() => { pegadoRef.current = true; setNuevosAbajo(0); bajar(true); }}>
                        <HiArrowDown size={16} aria-hidden="true" /> {nuevosAbajo === 1 ? 'Mensaje nuevo' : `${nuevosAbajo} mensajes nuevos`}
                    </button>
                )}

                {esAmigo ? (
                    <form className="ch-barra" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
                        <div className="ch-campo">
                            <textarea
                                ref={areaRef} value={texto} rows={1} maxLength={MAX}
                                onChange={(e) => setTexto(e.target.value)} onKeyDown={alTeclear}
                                onFocus={() => { if (pegadoRef.current) setTimeout(() => bajar(), 250); }}
                                placeholder="Escribe un mensaje" aria-label={`Mensaje para ${otro?.username ?? 'tu amigo'}`}
                                enterKeyHint="send" autoComplete="off"
                            />
                            <span className={`ch-cuenta${restantes <= 50 ? ' is-alerta' : ''}`} aria-live="off">{texto.length}/{MAX}</span>
                        </div>
                        <button type="submit" className="ch-enviar" disabled={!texto.trim()} aria-label="Enviar mensaje">
                            <HiPaperAirplane size={20} aria-hidden="true" />
                        </button>
                    </form>
                ) : (
                    <div className="ch-barra ch-barra--aviso">
                        <p>
                            {otro?.estadoAmistad === 'BLOQUEADO'
                                ? 'No puedes escribirle a esta persona.'
                                : 'Solo puedes chatear con tus amigos.'}
                        </p>
                        {otro && <Link to={`/usuario/${otro.id}`} className="gm-btn gm-btn--sm">Ver perfil</Link>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatConversacion;
