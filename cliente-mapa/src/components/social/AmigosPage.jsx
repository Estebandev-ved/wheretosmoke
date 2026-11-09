import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    HiArrowLeft, HiArrowPath, HiChatBubbleLeftRight, HiChatBubbleLeftEllipsis, HiCheck, HiXMark,
    HiMagnifyingGlass, HiUsers, HiInboxArrowDown,
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../WeedToast';
import useMensajes from '../../hooks/useMensajes';
import AuthModal from '../AuthModal';
import AvatarUsuario from './AvatarUsuario';
import BotonAmistadRapido from './BotonAmistadRapido';
import {
    getAmigos, getSolicitudes, aceptarSolicitud, rechazarSolicitud, cancelarSolicitud,
    buscarUsuarios, mensajeError,
} from '../../services/amigosApi';
import { tiempoCorto } from '../../utils/social';
import '../gamificacion.css';
import '../explorar.css';
import './social-usuarios.css';

const TABS = [
    { key: 'amigos', label: 'Amigos', icon: HiUsers },
    { key: 'solicitudes', label: 'Solicitudes', icon: HiInboxArrowDown },
    { key: 'buscar', label: 'Buscar', icon: HiMagnifyingGlass },
];

const Vacio = ({ img = '/icons/bud_smoking.png', titulo, texto, children }) => (
    <div className="gm-card gm-state">
        <img src={img} alt="" width="88" height="88" />
        <h2>{titulo}</h2>
        {texto && <p>{texto}</p>}
        {children}
    </div>
);

const ErrorEstado = ({ texto, onReintentar }) => (
    <div className="gm-card gm-state" role="alert">
        <img src="/icons/bud_angry.png" alt="" width="88" height="88" />
        <h2>No pudimos cargar</h2>
        <p>{texto}</p>
        <button type="button" className="gm-btn gm-btn--primary" onClick={onReintentar}>
            <HiArrowPath size={16} aria-hidden="true" /> Reintentar
        </button>
    </div>
);

const Esqueleto = ({ n = 4 }) => (
    <div className="ex-loading" aria-busy="true" aria-label="Cargando">
        {Array.from({ length: n }, (_, i) => <div key={i} className="gm-skel ex-skel-row" />)}
    </div>
);

// ───────── Pestaña: lista de amigos ─────────
const ListaAmigos = ({ onBuscar }) => {
    const navigate = useNavigate();
    const { refrescar } = useMensajes();
    const [lista, setLista] = useState(null);
    const [error, setError] = useState(null);

    const cargar = useCallback(async () => {
        try {
            const d = await getAmigos();
            setError(null);
            setLista(Array.isArray(d) ? d : []);
        } catch (e) {
            setError(mensajeError(e, 'No pudimos cargar tus amigos.'));
        }
    }, []);

    // La carga es asíncrona: el estado solo cambia tras la respuesta
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => { refrescar(); }, [refrescar]);

    if (error && !lista) return <ErrorEstado texto={error} onReintentar={cargar} />;
    if (!lista) return <Esqueleto />;
    if (lista.length === 0) {
        return (
            <Vacio titulo="Aún no tienes amigos" texto="Busca a tus parceros por su nombre de usuario y envíales una solicitud.">
                <button type="button" className="gm-btn gm-btn--primary" onClick={onBuscar}>
                    <HiMagnifyingGlass size={16} aria-hidden="true" /> Buscar gente
                </button>
            </Vacio>
        );
    }

    const ordenada = lista.slice().sort((a, b) => (b.noLeidos > 0) - (a.noLeidos > 0) || a.username.localeCompare(b.username, 'es'));

    return (
        <ul className="am-lista" aria-label={`Tus amigos (${lista.length})`}>
            {ordenada.map((a) => (
                <li key={a.id} className="gm-card am-fila">
                    <Link to={`/usuario/${a.id}`} className="am-fila__main" aria-label={`Ver perfil de ${a.username}${a.noLeidos > 0 ? `, ${a.noLeidos} mensajes sin leer` : ''}`}>
                        <span className="am-av">
                            <AvatarUsuario usuario={a} size={46} />
                            {a.noLeidos > 0 && <i className="am-punto" aria-hidden="true" />}
                        </span>
                        <span className="am-info">
                            <strong>{a.username}</strong>
                            <small>Nv. {a.nivel ?? 1} · {a.tituloRango || 'Novato'}</small>
                        </span>
                    </Link>
                    <button type="button" className="am-chat" onClick={() => navigate(`/chat/${a.id}`)} aria-label={`Chatear con ${a.username}`}>
                        <HiChatBubbleLeftEllipsis size={20} aria-hidden="true" />
                    </button>
                </li>
            ))}
        </ul>
    );
};

// ───────── Pestaña: solicitudes ─────────
const Solicitudes = () => {
    const toast = useToast();
    const { refrescar } = useMensajes();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [ocupado, setOcupado] = useState(null);

    const cargar = useCallback(async () => {
        try {
            const d = await getSolicitudes();
            setError(null);
            setData({ recibidas: d?.recibidas || [], enviadas: d?.enviadas || [] });
        } catch (e) {
            setError(mensajeError(e, 'No pudimos cargar las solicitudes.'));
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const accion = async (s, tipo) => {
        setOcupado(s.solicitudId);
        try {
            if (tipo === 'aceptar') await aceptarSolicitud(s.solicitudId);
            else if (tipo === 'rechazar') await rechazarSolicitud(s.solicitudId);
            else await cancelarSolicitud(s.solicitudId);
            const nombre = s.usuario?.username;
            toast.success(tipo === 'aceptar' ? `Ahora eres amigo de ${nombre}.` : tipo === 'rechazar' ? 'Solicitud rechazada.' : 'Solicitud cancelada.');
            // Optimista: la fila sale de inmediato; luego se confirma con el servidor
            setData((d) => d && ({
                recibidas: d.recibidas.filter((x) => x.solicitudId !== s.solicitudId),
                enviadas: d.enviadas.filter((x) => x.solicitudId !== s.solicitudId),
            }));
            refrescar();
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
            cargar();
        } finally {
            setOcupado(null);
        }
    };

    if (error && !data) return <ErrorEstado texto={error} onReintentar={cargar} />;
    if (!data) return <Esqueleto n={3} />;
    if (data.recibidas.length === 0 && data.enviadas.length === 0) {
        return <Vacio img="/icons/bud_map.png" titulo="Sin solicitudes" texto="Cuando alguien quiera ser tu amigo, aparecerá aquí." />;
    }

    return (
        <div className="ex-stack">
            <section aria-label="Solicitudes recibidas">
                <div className="gm-section-title"><h2>Recibidas</h2><small>{data.recibidas.length}</small></div>
                {data.recibidas.length === 0 ? (
                    <p className="am-nada">No tienes solicitudes por responder.</p>
                ) : (
                    <ul className="am-lista">
                        {data.recibidas.map((s) => (
                            <li key={s.solicitudId} className="gm-card am-fila am-fila--sol">
                                <Link to={`/usuario/${s.usuario?.id}`} className="am-fila__main" aria-label={`Ver perfil de ${s.usuario?.username}`}>
                                    <AvatarUsuario usuario={s.usuario} size={46} />
                                    <span className="am-info">
                                        <strong>{s.usuario?.username}</strong>
                                        <small>Nv. {s.usuario?.nivel ?? 1}{s.fecha ? ` · ${tiempoCorto(s.fecha)}` : ''}</small>
                                    </span>
                                </Link>
                                <div className="am-acc">
                                    <button type="button" className="gm-btn gm-btn--primary gm-btn--sm" disabled={ocupado === s.solicitudId} onClick={() => accion(s, 'aceptar')} aria-label={`Aceptar a ${s.usuario?.username}`}>
                                        <HiCheck size={16} aria-hidden="true" /> Aceptar
                                    </button>
                                    <button type="button" className="gm-btn gm-btn--sm" disabled={ocupado === s.solicitudId} onClick={() => accion(s, 'rechazar')} aria-label={`Rechazar a ${s.usuario?.username}`}>
                                        <HiXMark size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {data.enviadas.length > 0 && (
                <section aria-label="Solicitudes enviadas">
                    <div className="gm-section-title"><h2>Enviadas</h2><small>{data.enviadas.length}</small></div>
                    <ul className="am-lista">
                        {data.enviadas.map((s) => (
                            <li key={s.solicitudId} className="gm-card am-fila">
                                <Link to={`/usuario/${s.usuario?.id}`} className="am-fila__main" aria-label={`Ver perfil de ${s.usuario?.username}`}>
                                    <AvatarUsuario usuario={s.usuario} size={46} />
                                    <span className="am-info">
                                        <strong>{s.usuario?.username}</strong>
                                        <small>Pendiente{s.fecha ? ` · ${tiempoCorto(s.fecha)}` : ''}</small>
                                    </span>
                                </Link>
                                <button type="button" className="gm-btn gm-btn--sm" disabled={ocupado === s.solicitudId} onClick={() => accion(s, 'cancelar')} aria-label={`Cancelar la solicitud a ${s.usuario?.username}`}>
                                    Cancelar
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

// ───────── Pestaña: buscar ─────────
const Buscar = () => {
    const [q, setQ] = useState('');
    const [res, setRes] = useState(null);       // null = nada buscado todavía
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [intento, setIntento] = useState(0);
    const peticion = useRef(0);

    const termino = q.trim();
    useEffect(() => {
        if (termino.length < 2) return undefined;
        const mia = ++peticion.current;
        const t = setTimeout(async () => {
            setCargando(true);
            try {
                const d = await buscarUsuarios(termino);
                if (peticion.current !== mia) return; // llegó tarde: hay una búsqueda más nueva
                setError(null);
                setRes(Array.isArray(d) ? d : []);
            } catch (e) {
                if (peticion.current !== mia) return;
                setError(mensajeError(e, 'No pudimos buscar ahora.'));
            } finally {
                if (peticion.current === mia) setCargando(false);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [termino, intento]);

    const actualizar = (id, parcial) => setRes((r) => r && r.map((u) => (u.id === id ? { ...u, ...parcial } : u)));
    const corto = termino.length < 2;

    return (
        <div className="ex-stack">
            <form className="am-buscador" role="search" onSubmit={(e) => e.preventDefault()}>
                <HiMagnifyingGlass size={18} aria-hidden="true" />
                <input
                    type="search" value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Busca por nombre de usuario" aria-label="Buscar personas por nombre de usuario"
                    autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={40}
                />
                {q && (
                    <button type="button" className="am-limpiar" onClick={() => setQ('')} aria-label="Borrar búsqueda">
                        <HiXMark size={16} aria-hidden="true" />
                    </button>
                )}
            </form>

            <div aria-live="polite">
                {corto ? (
                    <Vacio img="/icons/bud_map.png" titulo="Encuentra a tus parceros" texto="Escribe al menos 2 letras de su nombre de usuario." />
                ) : error ? (
                    <ErrorEstado texto={error} onReintentar={() => setIntento((n) => n + 1)} />
                ) : cargando && !res ? (
                    <Esqueleto n={3} />
                ) : res && res.length === 0 && !cargando ? (
                    <Vacio titulo="Sin resultados" texto={`No encontramos a nadie con “${termino}”. Revisa que esté bien escrito.`} />
                ) : res && (
                    <ul className={`am-lista${cargando ? ' is-cargando' : ''}`} aria-label="Resultados de la búsqueda">
                        {res.map((u) => (
                            <li key={u.id} className="gm-card am-fila">
                                <Link to={`/usuario/${u.id}`} className="am-fila__main" aria-label={`Ver perfil de ${u.username}`}>
                                    <AvatarUsuario usuario={u} size={46} />
                                    <span className="am-info">
                                        <strong>{u.username}</strong>
                                        <small>Nv. {u.nivel ?? 1} · {u.tituloRango || 'Novato'}</small>
                                    </span>
                                </Link>
                                <BotonAmistadRapido usuario={u} onCambio={(p) => actualizar(u.id, p)} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

/** /amigos — pestañas Amigos | Solicitudes | Buscar (?tab=amigos|solicitudes|buscar) */
const AmigosPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();
    const { solicitudes, noLeidos } = useMensajes();
    const [params, setParams] = useSearchParams();
    const [showAuth, setShowAuth] = useState(false);
    // Solo al entrar: si hay solicitudes pendientes se abre esa pestaña (no salta después)
    const [abrirSolicitudes] = useState(solicitudes > 0);
    const refs = useRef({});
    const pedida = params.get('tab');
    const activa = TABS.some((t) => t.key === pedida) ? pedida : (abrirSolicitudes ? 'solicitudes' : 'amigos');

    const ir = (key) => setParams({ tab: key }, { replace: true });
    const onKeyDown = (e) => {
        const i = TABS.findIndex((t) => t.key === activa);
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + TABS.length) % TABS.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = TABS.length - 1;
        if (n === null) return;
        e.preventDefault();
        ir(TABS[n].key);
        refs.current[TABS[n].key]?.focus();
    };

    return (
        <main className="gm-page ex-page">
            <header className="ex-header">
                <div className="ex-header-inner">
                    <div className="am-titulo">
                        <button type="button" className="pu-icon" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/explorar'))} aria-label="Volver">
                            <HiArrowLeft size={20} aria-hidden="true" />
                        </button>
                        <div className="ex-title">
                            <h1>Amigos</h1>
                            <p className="gm-sub">Tu gente, tus mensajes.</p>
                        </div>
                        <Link to="/chat" className="gm-btn gm-btn--sm am-msgs" aria-label={noLeidos > 0 ? `Mensajes, ${noLeidos} sin leer` : 'Mensajes'}>
                            <HiChatBubbleLeftRight size={16} aria-hidden="true" /> Mensajes
                            {noLeidos > 0 && <span className="su-badge" aria-hidden="true">{noLeidos > 9 ? '9+' : noLeidos}</span>}
                        </Link>
                    </div>
                    {isAuthenticated && (
                        <div className="ex-tabs" role="tablist" aria-label="Secciones de amigos" onKeyDown={onKeyDown}>
                            {TABS.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key} ref={(el) => { refs.current[key] = el; }} type="button" role="tab"
                                    id={`am-tab-${key}`} aria-selected={activa === key} aria-controls={`am-panel-${key}`}
                                    tabIndex={activa === key ? 0 : -1}
                                    className={`ex-tab ${activa === key ? 'is-active' : ''}`} onClick={() => ir(key)}
                                >
                                    {React.createElement(Icon, { size: 16, 'aria-hidden': 'true' })}
                                    {label}
                                    {key === 'solicitudes' && solicitudes > 0 && (
                                        <span className="su-badge su-badge--inline" aria-label={`${solicitudes} pendientes`}>{solicitudes > 9 ? '9+' : solicitudes}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <div className="gm-wrap ex-body">
                {!loading && !isAuthenticated ? (
                    <Vacio titulo="Entra para ver a tus amigos" texto="Inicia sesión para agregar amigos, aceptar solicitudes y chatear.">
                        <button type="button" className="gm-btn gm-btn--primary" onClick={() => setShowAuth(true)}>Iniciar sesión o registrarme</button>
                    </Vacio>
                ) : isAuthenticated && (
                    <section role="tabpanel" id={`am-panel-${activa}`} aria-labelledby={`am-tab-${activa}`} className="ex-panel">
                        {activa === 'amigos' && <ListaAmigos onBuscar={() => ir('buscar')} />}
                        {activa === 'solicitudes' && <Solicitudes />}
                        {activa === 'buscar' && <Buscar />}
                    </section>
                )}
            </div>
            {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode />, document.body)}
        </main>
    );
};

export default AmigosPage;
