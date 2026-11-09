import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    HiArrowLeft, HiArrowPath, HiEllipsisVertical, HiUserPlus, HiChatBubbleLeftEllipsis,
    HiCheckBadge, HiClock, HiNoSymbol, HiUserMinus, HiXMark, HiCheck, HiMapPin, HiUsers,
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../WeedToast';
import useMensajes from '../../hooks/useMensajes';
import useHaptics from '../../hooks/useHaptics';
import CarruselSugeridas from './personas/CarruselSugeridas';
import AmigosEnComunSheet from './personas/AmigosEnComunSheet';
import AuthModal from '../AuthModal';
import LlamaRacha from '../fx/LlamaRacha';
import AvatarUsuario from './AvatarUsuario';
import ConfirmSheet from './ConfirmSheet';
import {
    getPerfilPublico, enviarSolicitud, aceptarSolicitud, rechazarSolicitud, cancelarSolicitud,
    eliminarAmigo, bloquearUsuario, desbloquearUsuario, mensajeError, estadoHttp,
} from '../../services/amigosApi';
import { mesAnio } from '../../utils/social';
import '../gamificacion.css';
import '../profile-page.css';
import './social-usuarios.css';
import './personas/personas.css';

const Estado = ({ img, titulo, texto, children, alerta }) => (
    <div className="gm-card gm-state" role={alerta ? 'alert' : undefined}>
        <img src={img} alt="" width="88" height="88" />
        <h2>{titulo}</h2>
        {texto && <p>{texto}</p>}
        {children}
    </div>
);

const Cabecera = ({ onVolver, menu }) => (
    <div className="pu-top">
        <button type="button" className="pu-icon" onClick={onVolver} aria-label="Volver">
            <HiArrowLeft size={20} aria-hidden="true" />
        </button>
        {menu}
    </div>
);

const PerfilCargado = ({ id }) => {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authCargando } = useAuth();
    const toast = useToast();
    const { refrescar } = useMensajes();
    const h = useHaptics();

    const [perfil, setPerfil] = useState(null);
    const [fallo, setFallo] = useState(null); // {codigo, mensaje}
    const [ocupado, setOcupado] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [confirmar, setConfirmar] = useState(null); // 'eliminar' | 'bloquear'
    const [showAuth, setShowAuth] = useState(false);
    const [verComun, setVerComun] = useState(false);
    const menuRef = useRef(null);

    const cargar = useCallback(async () => {
        try {
            const d = await getPerfilPublico(id);
            setFallo(null);
            setPerfil(d);
        } catch (e) {
            setFallo({ codigo: estadoHttp(e), mensaje: mensajeError(e, 'No pudimos cargar este perfil.') });
        }
    }, [id]);

    useEffect(() => {
        if (!isAuthenticated) return;
        cargar();
    }, [isAuthenticated, cargar]);

    useEffect(() => {
        if (perfil?.estadoAmistad === 'YO') navigate('/perfil', { replace: true });
    }, [perfil, navigate]);

    // Cerrar el menú ⋯ con Escape o al tocar fuera
    useEffect(() => {
        if (!menuAbierto) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setMenuAbierto(false); };
        const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false); };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onDown);
        };
    }, [menuAbierto]);

    const volver = () => (window.history.length > 1 ? navigate(-1) : navigate('/explorar?tab=ranking'));

    // Ejecuta una acción, avisa y recarga el perfil
    const ejecutar = async (accion, okMsg) => {
        setOcupado(true);
        try {
            await accion();
            if (okMsg) { toast.success(okMsg); h.exito(); }
            await cargar();
            refrescar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setOcupado(false);
            setConfirmar(null);
        }
    };

    if (!authCargando && !isAuthenticated) {
        return (
            <main className="gm-page">
                <div className="gm-wrap">
                    <Cabecera onVolver={volver} />
                    <Estado img="/icons/bud_smoking.png" titulo="Inicia sesión para ver perfiles" texto="Conoce a la comunidad, agrega amigos y escríbeles desde tu cuenta.">
                        <button type="button" className="gm-btn gm-btn--primary" onClick={() => setShowAuth(true)}>Iniciar sesión o registrarme</button>
                    </Estado>
                </div>
                {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode />, document.body)}
            </main>
        );
    }

    if (fallo && !perfil) {
        const noExiste = fallo.codigo === 404;
        return (
            <main className="gm-page">
                <div className="gm-wrap">
                    <Cabecera onVolver={volver} />
                    <Estado
                        alerta
                        img={noExiste ? '/icons/bud_map.png' : '/icons/bud_angry.png'}
                        titulo={noExiste ? 'No encontramos a esta persona' : 'No pudimos cargar el perfil'}
                        texto={noExiste ? 'Puede que haya cambiado de nombre o ya no esté en la app.' : fallo.mensaje}
                    >
                        {noExiste ? (
                            <Link to="/amigos?tab=buscar" className="gm-btn gm-btn--primary">Buscar gente</Link>
                        ) : (
                            <button type="button" className="gm-btn gm-btn--primary" onClick={cargar}>
                                <HiArrowPath size={16} aria-hidden="true" /> Reintentar
                            </button>
                        )}
                    </Estado>
                </div>
            </main>
        );
    }

    if (!perfil || perfil.estadoAmistad === 'YO') {
        return (
            <main className="gm-page">
                <div className="gm-wrap" aria-busy="true" aria-label="Cargando perfil">
                    <Cabecera onVolver={volver} />
                    <div className="gm-skel" style={{ height: 190 }} />
                    <div className="gm-skel" style={{ height: 84 }} />
                    <div className="gm-skel" style={{ height: 56 }} />
                </div>
            </main>
        );
    }

    const est = perfil.estadoAmistad;
    const bloqueadoPorMi = !!perfil.bloqueadoPorMi;
    const comunes = Array.isArray(perfil.amigosEnComun) ? perfil.amigosEnComun.length : Number(perfil.amigosEnComun) || 0;
    const stats = [
        { v: (perfil.puntos ?? 0).toLocaleString('es-CO'), l: 'XP' },
        { v: perfil.spotsDescubiertos ?? 0, l: 'Spots descubiertos' },
        { v: perfil.comunasCompletas ?? 0, l: 'Comunas completas' },
        { v: perfil.totalAmigos ?? 0, l: 'Amigos' },
    ];

    const desbloquear = () => ejecutar(() => desbloquearUsuario(perfil.id), `Desbloqueaste a ${perfil.username}.`);

    const menu = (
        <div className="pu-menu" ref={menuRef}>
            <button
                type="button" className="pu-icon" onClick={() => setMenuAbierto((v) => !v)}
                aria-label="Más opciones" aria-haspopup="menu" aria-expanded={menuAbierto}
            >
                <HiEllipsisVertical size={20} aria-hidden="true" />
            </button>
            {menuAbierto && (
                <div className="pu-menu__list" role="menu">
                    {bloqueadoPorMi ? (
                        <button type="button" role="menuitem" className="pu-menu__item" onClick={() => { setMenuAbierto(false); desbloquear(); }}>
                            <HiCheck size={18} aria-hidden="true" /> Desbloquear
                        </button>
                    ) : (
                        <button type="button" role="menuitem" className="pu-menu__item pu-menu__item--danger" onClick={() => { setMenuAbierto(false); setConfirmar('bloquear'); }}>
                            <HiNoSymbol size={18} aria-hidden="true" /> Bloquear
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const acciones = (() => {
        if (est === 'BLOQUEADO') {
            return bloqueadoPorMi ? (
                <>
                    <p className="pu-nota"><HiNoSymbol size={16} aria-hidden="true" /> Bloqueaste a esta persona. No podrán escribirse.</p>
                    <button type="button" className="gm-btn gm-btn--block" disabled={ocupado} onClick={desbloquear}>
                        Desbloquear
                    </button>
                </>
            ) : (
                <p className="pu-nota"><HiNoSymbol size={16} aria-hidden="true" /> No puedes interactuar con esta persona.</p>
            );
        }
        if (est === 'NINGUNA') {
            return (
                <button type="button" className="gm-btn gm-btn--primary gm-btn--block" disabled={ocupado} onClick={() => ejecutar(() => enviarSolicitud(perfil.id), `Solicitud enviada a ${perfil.username}.`)}>
                    <HiUserPlus size={18} aria-hidden="true" /> {ocupado ? 'Enviando…' : 'Agregar amigo'}
                </button>
            );
        }
        if (est === 'ENVIADA') {
            return (
                <div className="pu-fila">
                    <span className="pu-estado"><HiClock size={16} aria-hidden="true" /> Solicitud enviada</span>
                    {perfil.solicitudId != null && (
                        <button type="button" className="gm-btn" disabled={ocupado} onClick={() => ejecutar(() => cancelarSolicitud(perfil.solicitudId), 'Solicitud cancelada.')}>
                            Cancelar
                        </button>
                    )}
                </div>
            );
        }
        if (est === 'RECIBIDA') {
            return (
                <>
                    <p className="pu-nota pu-nota--ok">{perfil.username} quiere ser tu amigo.</p>
                    <div className="pu-fila pu-fila--dos">
                        <button type="button" className="gm-btn gm-btn--primary" disabled={ocupado || perfil.solicitudId == null} onClick={() => ejecutar(() => aceptarSolicitud(perfil.solicitudId), `Ahora eres amigo de ${perfil.username}.`)}>
                            <HiCheck size={18} aria-hidden="true" /> Aceptar
                        </button>
                        <button type="button" className="gm-btn" disabled={ocupado || perfil.solicitudId == null} onClick={() => ejecutar(() => rechazarSolicitud(perfil.solicitudId), 'Solicitud rechazada.')}>
                            <HiXMark size={18} aria-hidden="true" /> Rechazar
                        </button>
                    </div>
                </>
            );
        }
        if (est === 'AMIGOS') {
            return (
                <>
                    <div className="pu-fila pu-fila--dos">
                        <button type="button" className="gm-btn gm-btn--primary" onClick={() => navigate(`/chat/${perfil.id}`)}>
                            <HiChatBubbleLeftEllipsis size={18} aria-hidden="true" /> Mensaje
                        </button>
                        <span className="pu-estado pu-estado--ok"><HiCheckBadge size={18} aria-hidden="true" /> Amigos</span>
                    </div>
                    <button type="button" className="pu-link-peligro" onClick={() => setConfirmar('eliminar')}>
                        <HiUserMinus size={16} aria-hidden="true" /> Eliminar amigo
                    </button>
                </>
            );
        }
        return null;
    })();

    return (
        <main className="gm-page">
            <div className="gm-wrap">
                <Cabecera onVolver={volver} menu={menu} />

                <section className="gm-card pf-hero pu-hero" aria-label={`Perfil de ${perfil.username}`}>
                    <AvatarUsuario usuario={perfil} size={124} />
                    <div className="pf-hero-info">
                        <h1>{perfil.username}</h1>
                        <div className="pf-hero-chips">
                            <span className="gm-chip gm-chip--accent">{perfil.tituloRango || 'Novato'}</span>
                            <span className="gm-chip">Nivel {perfil.nivel ?? 1}</span>
                            {(perfil.rachaDias ?? 0) > 0 && (
                                <span className="gm-chip pu-racha" aria-label={`Racha de ${perfil.rachaDias} días`}>
                                    <LlamaRacha dias={perfil.rachaDias} size={14} /> {perfil.rachaDias}
                                </span>
                            )}
                        </div>
                        {perfil.miembroDesde && <small className="gm-sub">Miembro desde {mesAnio(perfil.miembroDesde)}</small>}
                    </div>
                </section>

                <section aria-label="Estadísticas">
                    <ul className="pf-stats pu-stats">
                        {stats.map((s) => (
                            <li key={s.l}><strong>{s.v}</strong><span>{s.l}</span></li>
                        ))}
                    </ul>
                </section>

                {comunes > 0 && (
                    <button type="button" className="gm-btn pe-comun-perfil" onClick={() => setVerComun(true)} aria-haspopup="dialog" aria-label={`${comunes} ${comunes === 1 ? 'amigo' : 'amigos'} en común con ${perfil.username}. Ver lista`}>
                        <HiUsers size={16} aria-hidden="true" /> {comunes} {comunes === 1 ? 'amigo' : 'amigos'} en común
                    </button>
                )}

                <section key={est} className="gm-card pu-acciones pu-acciones--pop" aria-label="Acciones" aria-live="polite">
                    {acciones}
                </section>

                {(perfil.spotsDescubiertos ?? 0) > 0 && (
                    <p className="pu-pie"><HiMapPin size={14} aria-hidden="true" /> {perfil.username} ha descubierto {perfil.spotsDescubiertos} {perfil.spotsDescubiertos === 1 ? 'spot' : 'spots'} para la comunidad.</p>
                )}

                {est === 'AMIGOS' && <CarruselSugeridas titulo="Más personas" compacta limite={8} />}
            </div>

            {verComun && <AmigosEnComunSheet usuarioId={perfil.id} nombre={perfil.username} onClose={() => setVerComun(false)} />}
            {confirmar === 'eliminar' && (
                <ConfirmSheet
                    titulo="Eliminar amigo"
                    mensaje={`¿Quitar a ${perfil.username} de tus amigos? Podrás volver a enviarle una solicitud más adelante.`}
                    confirmar="Eliminar" peligro ocupado={ocupado}
                    onClose={() => setConfirmar(null)}
                    onConfirm={() => ejecutar(() => eliminarAmigo(perfil.id), `Eliminaste a ${perfil.username} de tus amigos.`)}
                />
            )}
            {confirmar === 'bloquear' && (
                <ConfirmSheet
                    titulo="Bloquear persona"
                    mensaje={`${perfil.username} dejará de ser tu amigo y no podrán escribirse ni enviarse solicitudes. Puedes desbloquearla cuando quieras.`}
                    confirmar="Bloquear" peligro ocupado={ocupado}
                    onClose={() => setConfirmar(null)}
                    onConfirm={() => ejecutar(() => bloquearUsuario(perfil.id), `Bloqueaste a ${perfil.username}.`)}
                />
            )}
        </main>
    );
};

/** Perfil público de una persona (/usuario/:id). El propio perfil redirige a /perfil. */
const PerfilPublico = () => {
    const { id } = useParams();
    return <PerfilCargado key={id} id={id} />;
};

export default PerfilPublico;
