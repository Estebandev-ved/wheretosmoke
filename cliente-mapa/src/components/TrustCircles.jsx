import { API_BASE, WS_URL } from '../config';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
    HiUserGroup, HiPlus, HiKey, HiClipboardDocument, HiCheck, HiChevronDown,
    HiArrowLeft, HiArrowRightOnRectangle, HiLockClosed, HiMapPin,
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import BottomSheet from './BottomSheet';
import ConfirmDialog from './ConfirmDialog';
import CirculoMeta from './CirculoMeta';
import './gamificacion.css';
import './TrustCircles.css';

const API_BASE_URL = API_BASE;
const MASCOTA = '/icons/bud_smoking.png';
const COLORES = ['#22C55E', '#60A5FA', '#A78BFA', '#FACC15', '#FB923C', '#F472B6', '#F87171'];
const INTERVALO_UBICACION_MS = 30000;

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const mensajeError = (error, porDefecto) => error?.response?.data?.error || porDefecto;

/* ── Compartir ubicación: el envío periódico vive a nivel de módulo para que siga activo
      aunque se cierre la hoja (igual que antes), y se detiene al apagar el interruptor. ── */
const envios = new Map(); // circleId -> intervalId
let ultimaUbicacion = null;

const enviarUbicacion = async (circleId) => {
    if (!ultimaUbicacion || !localStorage.getItem('token')) return;
    await axios.post(`${API_BASE_URL}/circulos/${circleId}/ubicacion`, {
        latitud: ultimaUbicacion.lat,
        longitud: ultimaUbicacion.lng,
    }, { headers: authHeaders() });
};

const iniciarEnvio = (circleId) => {
    if (envios.has(circleId)) return;
    const id = setInterval(() => {
        if (!localStorage.getItem('token')) { detenerEnvio(circleId); return; }
        enviarUbicacion(circleId).catch(() => {});
    }, INTERVALO_UBICACION_MS);
    envios.set(circleId, id);
};

function detenerEnvio(circleId) {
    clearInterval(envios.get(circleId));
    envios.delete(circleId);
}

export default function TrustCircles({ userLocation, onCircleMembersUpdate, onClose, onLogin }) {
    const { user, isAuthenticated } = useAuth();
    const [circles, setCircles] = useState([]);
    const [estado, setEstado] = useState('cargando'); // cargando | listo | error
    const [vista, setVista] = useState('lista'); // lista | crear | unirse
    const [selectedId, setSelectedId] = useState(null);
    const [sharing, setSharing] = useState({}); // circleId -> bool (override local)
    const [busy, setBusy] = useState(null);
    const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }
    const [copiado, setCopiado] = useState(null);
    const [salir, setSalir] = useState(null); // círculo pendiente de confirmar salida
    const [nombre, setNombre] = useState('');
    const [color, setColor] = useState(COLORES[0]);
    const [codigo, setCodigo] = useState('');

    const membersCb = useRef(onCircleMembersUpdate);
    useEffect(() => { membersCb.current = onCircleMembersUpdate; }, [onCircleMembersUpdate]);

    useEffect(() => { ultimaUbicacion = userLocation || ultimaUbicacion; }, [userLocation]);

    const avisar = useCallback((tipo, texto) => setAviso({ tipo, texto }), []);
    useEffect(() => {
        if (!aviso) return undefined;
        const t = setTimeout(() => setAviso(null), 4500);
        return () => clearTimeout(t);
    }, [aviso]);

    const cargar = useCallback(async () => {
        if (!localStorage.getItem('token')) { setEstado('listo'); setCircles([]); return; }
        try {
            const { data } = await axios.get(`${API_BASE_URL}/circulos/mis-circulos`, { headers: authHeaders() });
            setCircles(Array.isArray(data) ? data : []);
            setEstado('listo');
        } catch (error) {
            console.error('Error cargando círculos:', error);
            setEstado('error');
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    // ¿Estoy compartiendo en este círculo? (servidor, con override local tras alternar)
    const compartiendo = useCallback((circle) => {
        if (sharing[circle.id] !== undefined) return sharing[circle.id];
        const yo = (circle.miembros || []).find((m) => m.username === user?.username);
        return !!yo?.compartiendoUbicacion;
    }, [sharing, user]);

    // Reanudar el envío periódico de los círculos donde ya compartes
    useEffect(() => {
        circles.forEach((c) => { if (compartiendo(c) && userLocation) iniciarEnvio(c.id); });
    }, [circles, compartiendo, userLocation]);

    // Selección automática del primer círculo (el usuario ya es miembro)
    const selected = circles.find((c) => c.id === selectedId) || null;
    useEffect(() => {
        if (circles.length > 0 && !circles.some((c) => c.id === selectedId)) {
                setSelectedId(circles[0].id);
        }
    }, [circles, selectedId]);

    // WebSocket de ubicaciones: solo cuando ya soy miembro del círculo abierto
    useEffect(() => {
        if (!selected) return undefined;
        const token = localStorage.getItem('token');
        if (!token) return undefined;

        const circleId = selected.id;
        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
        });
        client.onConnect = () => {
            client.subscribe(`/topic/circulo/${circleId}/ubicaciones`, (frame) => {
                const data = JSON.parse(frame.body);
                if (data.ubicacion) membersCb.current && membersCb.current(data);
            });
        };
        client.onStompError = (frame) => {
            console.error('Error STOMP:', frame.headers?.message);
        };
        client.activate();
        return () => { client.deactivate(); };
    }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const crear = async (e) => {
        e.preventDefault();
        const limpio = nombre.trim();
        if (!limpio) return;
        setBusy('crear');
        try {
            const { data } = await axios.post(`${API_BASE_URL}/circulos`, { nombre: limpio, color }, { headers: authHeaders() });
            setNombre('');
            setVista('lista');
            await cargar();
            setSelectedId(data.id);
            avisar('ok', 'Círculo creado. Comparte el código con tu gente.');
        } catch (error) {
            console.error('Error creando círculo:', error);
            avisar('error', mensajeError(error, 'No pudimos crear el círculo. Intenta de nuevo.'));
        } finally {
            setBusy(null);
        }
    };

    const unirse = async (e) => {
        e.preventDefault();
        const limpio = codigo.trim();
        if (!limpio) return;
        setBusy('unirse');
        try {
            await axios.post(`${API_BASE_URL}/circulos/unirse`, { codigoInvitacion: limpio }, { headers: authHeaders() });
            setCodigo('');
            setVista('lista');
            await cargar();
            avisar('ok', 'Listo, ya eres parte del círculo.');
        } catch (error) {
            console.error('Error uniéndose al círculo:', error);
            avisar('error', mensajeError(error, 'Ese código no es válido. Revísalo e intenta otra vez.'));
        } finally {
            setBusy(null);
        }
    };

    const alternarUbicacion = async (circle) => {
        if (busy) return;
        if (compartiendo(circle)) {
            setBusy(`ubi-${circle.id}`);
            try {
                await axios.delete(`${API_BASE_URL}/circulos/${circle.id}/ubicacion`, { headers: authHeaders() });
                detenerEnvio(circle.id);
                setSharing((s) => ({ ...s, [circle.id]: false }));
                avisar('ok', 'Dejaste de compartir tu ubicación.');
            } catch (error) {
                console.error('Error deteniendo ubicación:', error);
                avisar('error', mensajeError(error, 'No pudimos detener el envío. Intenta de nuevo.'));
            } finally {
                setBusy(null);
            }
            return;
        }
        if (!userLocation) {
            avisar('error', 'Activa tu ubicación en el mapa para poder compartirla.');
            return;
        }
        setBusy(`ubi-${circle.id}`);
        try {
            ultimaUbicacion = userLocation;
            await enviarUbicacion(circle.id);
            iniciarEnvio(circle.id);
            setSharing((s) => ({ ...s, [circle.id]: true }));
            avisar('ok', 'Compartiendo tu ubicación con este círculo.');
        } catch (error) {
            console.error('Error compartiendo ubicación:', error);
            avisar('error', mensajeError(error, 'No pudimos compartir tu ubicación. Intenta de nuevo.'));
        } finally {
            setBusy(null);
        }
    };

    const confirmarSalida = async () => {
        const circle = salir;
        setSalir(null);
        if (!circle) return;
        setBusy(`salir-${circle.id}`);
        try {
            await axios.delete(`${API_BASE_URL}/circulos/${circle.id}/salir`, { headers: authHeaders() });
            detenerEnvio(circle.id);
            setSharing((s) => { const n = { ...s }; delete n[circle.id]; return n; });
            if (selectedId === circle.id) setSelectedId(null);
            await cargar();
            avisar('ok', `Saliste de ${circle.nombre}.`);
        } catch (error) {
            console.error('Error saliendo del círculo:', error);
            avisar('error', mensajeError(error, 'No pudimos sacarte del círculo. Intenta de nuevo.'));
        } finally {
            setBusy(null);
        }
    };

    const copiarCodigo = async (circle) => {
        try {
            await navigator.clipboard.writeText(circle.codigoInvitacion);
        } catch {
            // Respaldo para navegadores sin Clipboard API
            const ta = document.createElement('textarea');
            ta.value = circle.codigoInvitacion;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch { /* sin respaldo posible */ }
            document.body.removeChild(ta);
        }
        setCopiado(circle.id);
        setTimeout(() => setCopiado((c) => (c === circle.id ? null : c)), 2000);
    };

    const escape = () => {
        if (salir) setSalir(null);
        else if (vista !== 'lista') setVista('lista');
        else onClose();
    };

    /* ── Contenido ── */
    let cuerpo;
    if (!isAuthenticated) {
        cuerpo = (
            <div className="gm-state tc-state">
                <img src={MASCOTA} alt="" />
                <h3>Inicia sesión para usar círculos</h3>
                <p>Crea un círculo con tus amigos y comparte tu ubicación solo con ellos.</p>
                <button type="button" className="gm-btn gm-btn--primary" onClick={onLogin || onClose}>Iniciar sesión</button>
            </div>
        );
    } else if (vista === 'crear') {
        cuerpo = (
            <form className="tc-form" onSubmit={crear}>
                <button type="button" className="tc-back" onClick={() => setVista('lista')}>
                    <HiArrowLeft size={18} aria-hidden="true" /> Volver
                </button>
                <h3>Crear círculo</h3>
                <label className="tc-label" htmlFor="tc-nombre">Nombre del círculo</label>
                <input
                    id="tc-nombre" className="tc-input" type="text" maxLength={40} autoFocus required
                    placeholder="Ej: Parche del parque" value={nombre} onChange={(e) => setNombre(e.target.value)}
                />
                <span className="tc-label" id="tc-color-label">Color</span>
                <div className="tc-colors" role="radiogroup" aria-labelledby="tc-color-label">
                    {COLORES.map((c) => (
                        <button
                            key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Color ${c}`}
                            className={`tc-color${color === c ? ' is-on' : ''}`} style={{ '--c': c }} onClick={() => setColor(c)}
                        >
                            {color === c && <HiCheck size={16} aria-hidden="true" />}
                        </button>
                    ))}
                </div>
                <button type="submit" className="gm-btn gm-btn--primary gm-btn--block tc-submit" disabled={busy === 'crear' || !nombre.trim()}>
                    {busy === 'crear' ? 'Creando...' : 'Crear círculo'}
                </button>
            </form>
        );
    } else if (vista === 'unirse') {
        cuerpo = (
            <form className="tc-form" onSubmit={unirse}>
                <button type="button" className="tc-back" onClick={() => setVista('lista')}>
                    <HiArrowLeft size={18} aria-hidden="true" /> Volver
                </button>
                <h3>Unirme con código</h3>
                <p className="tc-hint">Pega el código de invitación que te compartieron.</p>
                <label className="tc-label" htmlFor="tc-codigo">Código de invitación</label>
                <input
                    id="tc-codigo" className="tc-input tc-input--code" type="text" autoFocus required
                    autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={16}
                    placeholder="ABC123XY" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s/g, ''))}
                />
                <button type="submit" className="gm-btn gm-btn--primary gm-btn--block tc-submit" disabled={busy === 'unirse' || !codigo.trim()}>
                    {busy === 'unirse' ? 'Uniéndote...' : 'Unirme'}
                </button>
            </form>
        );
    } else if (estado === 'cargando') {
        cuerpo = (
            <div className="tc-list" aria-busy="true" aria-label="Cargando tus círculos">
                {[0, 1].map((i) => <div key={i} className="gm-skel tc-skel" />)}
            </div>
        );
    } else if (estado === 'error') {
        cuerpo = (
            <div className="gm-state tc-state">
                <img src="/icons/bud_angry.png" alt="" />
                <h3>No pudimos cargar tus círculos</h3>
                <p>Revisa tu conexión e inténtalo de nuevo.</p>
                <button type="button" className="gm-btn gm-btn--primary" onClick={() => { setEstado('cargando'); cargar(); }}>Reintentar</button>
            </div>
        );
    } else if (circles.length === 0) {
        cuerpo = (
            <div className="gm-state tc-state">
                <img src={MASCOTA} alt="" />
                <h3>Aún no tienes círculos</h3>
                <p>Crea uno para tu parche o únete con un código. Solo ellos verán tu ubicación, y solo cuando tú quieras.</p>
            </div>
        );
    } else {
        cuerpo = (
            <ul className="tc-list">
                {circles.map((circle) => {
                    const abierto = selectedId === circle.id;
                    const activo = compartiendo(circle);
                    const miembros = circle.miembros || [];
                    const ocupado = busy === `ubi-${circle.id}`;
                    return (
                        <li key={circle.id} className={`gm-card tc-card${abierto ? ' is-open' : ''}`} style={{ '--c': circle.color || COLORES[0] }}>
                            <button
                                type="button" className="tc-card__head" aria-expanded={abierto}
                                aria-controls={`tc-det-${circle.id}`} onClick={() => setSelectedId(abierto ? null : circle.id)}
                            >
                                <span className="tc-dot" aria-hidden="true" />
                                <span className="tc-card__title">
                                    <strong>{circle.nombre}</strong>
                                    <small>
                                        {circle.totalMiembros} {circle.totalMiembros === 1 ? 'miembro' : 'miembros'}
                                        {miembros.some((m) => m.compartiendoUbicacion) && ' · hay ubicaciones activas'}
                                    </small>
                                </span>
                                <span className="tc-avatars" aria-hidden="true">
                                    {miembros.slice(0, 4).map((m) => (
                                        <span key={m.usuarioId} className={`tc-avatar${m.compartiendoUbicacion ? ' is-live' : ''}`}>
                                            <img src={MASCOTA} alt="" />
                                        </span>
                                    ))}
                                    {miembros.length > 4 && <span className="tc-avatar tc-avatar--more">+{miembros.length - 4}</span>}
                                </span>
                                <HiChevronDown className="tc-chev" size={20} aria-hidden="true" />
                            </button>

                            {abierto && (
                                <div className="tc-detail" id={`tc-det-${circle.id}`}>
                                    <CirculoMeta circleId={circle.id} />
                                    <div className="tc-share">
                                        <div className="tc-share__text">
                                            <strong id={`tc-sw-${circle.id}`}>Compartir mi ubicación</strong>
                                            <span>{activo ? 'Tu círculo te ve en el mapa ahora mismo.' : 'Apagado. Nadie ve dónde estás.'}</span>
                                        </div>
                                        <button
                                            type="button" role="switch" aria-checked={activo} aria-labelledby={`tc-sw-${circle.id}`}
                                            className={`tc-switch${activo ? ' is-on' : ''}`} disabled={ocupado} onClick={() => alternarUbicacion(circle)}
                                        >
                                            <span className="tc-switch__knob" />
                                        </button>
                                    </div>
                                    <p className="tc-privacy">
                                        <HiLockClosed size={14} aria-hidden="true" />
                                        Solo los miembros de este círculo ven tu ubicación mientras esté activa. Puedes apagarla cuando quieras.
                                    </p>

                                    <div className="tc-code">
                                        <div>
                                            <span className="tc-label">Código de invitación</span>
                                            <code>{circle.codigoInvitacion}</code>
                                        </div>
                                        <button type="button" className="gm-btn gm-btn--sm" onClick={() => copiarCodigo(circle)} aria-label={`Copiar código ${circle.codigoInvitacion}`}>
                                            {copiado === circle.id
                                                ? <><HiCheck size={16} aria-hidden="true" /> Copiado</>
                                                : <><HiClipboardDocument size={16} aria-hidden="true" /> Copiar</>}
                                        </button>
                                    </div>

                                    <span className="tc-label">Miembros</span>
                                    <ul className="tc-members">
                                        {miembros.map((m) => (
                                            <li key={m.usuarioId}>
                                                <span className={`tc-avatar${m.compartiendoUbicacion ? ' is-live' : ''}`}><img src={MASCOTA} alt="" /></span>
                                                <span className="tc-members__name">{m.username}{m.username === user?.username && ' (tú)'}</span>
                                                {m.compartiendoUbicacion && (
                                                    <span className="tc-live"><HiMapPin size={13} aria-hidden="true" /> Compartiendo</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        type="button" className="tc-leave" disabled={busy === `salir-${circle.id}`}
                                        onClick={() => setSalir(circle)}
                                    >
                                        <HiArrowRightOnRectangle size={18} aria-hidden="true" /> Salir del círculo
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <>
            <BottomSheet
                title="Círculos de confianza"
                subtitle="Tu parche, tu ubicación, tus reglas"
                icon={HiUserGroup}
                onClose={onClose}
                onEscape={escape}
                className="tc-sheet"
            >
                {isAuthenticated && vista === 'lista' && (
                    <div className="tc-actions">
                        <button type="button" className="gm-btn gm-btn--primary" onClick={() => setVista('crear')}>
                            <HiPlus size={18} aria-hidden="true" /> Crear círculo
                        </button>
                        <button type="button" className="gm-btn" onClick={() => setVista('unirse')}>
                            <HiKey size={18} aria-hidden="true" /> Unirme con código
                        </button>
                    </div>
                )}
                <div className="tc-body">{cuerpo}</div>
                <div className="tc-toast-slot" role="status" aria-live="polite">
                    {aviso && <div className={`tc-toast tc-toast--${aviso.tipo}`}>{aviso.texto}</div>}
                </div>
            </BottomSheet>

            <ConfirmDialog
                isOpen={!!salir}
                type="warning"
                title="¿Salir del círculo?"
                message={salir ? `Dejarás de ver a los miembros de "${salir.nombre}" y dejarán de verte. Necesitarás un código para volver a entrar.` : ''}
                confirmText="Salir"
                cancelText="Quedarme"
                onConfirm={confirmarSalida}
                onCancel={() => setSalir(null)}
            />
        </>
    );
}
