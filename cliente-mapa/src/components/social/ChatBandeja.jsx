import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiArrowPath, HiUsers, HiPencilSquare } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import useMensajes from '../../hooks/useMensajes';
import AuthModal from '../AuthModal';
import AvatarUsuario from './AvatarUsuario';
import { getConversaciones, mensajeError } from '../../services/amigosApi';
import { tiempoCorto } from '../../utils/social';
import '../gamificacion.css';
import '../explorar.css';
import './social-usuarios.css';

/** /chat — bandeja de conversaciones. */
const ChatBandeja = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();
    const { suscribir, conectado, refrescar } = useMensajes();
    const [lista, setLista] = useState(null);
    const [error, setError] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const temporizador = useRef(null);

    const cargar = useCallback(async () => {
        try {
            const d = await getConversaciones();
            setError(null);
            setLista(Array.isArray(d) ? d : []);
        } catch (e) {
            setError(mensajeError(e, 'No pudimos cargar tus mensajes.'));
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return undefined;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargar();
        refrescar();
        return undefined;
    }, [isAuthenticated, cargar, refrescar]);

    // Tiempo real: cada evento recarga la bandeja (con un pequeño agrupador)
    useEffect(() => {
        if (!isAuthenticated) return undefined;
        const baja = suscribir(() => {
            clearTimeout(temporizador.current);
            temporizador.current = setTimeout(cargar, 250);
        });
        return () => { baja(); clearTimeout(temporizador.current); };
    }, [isAuthenticated, suscribir, cargar]);

    // Sin socket: sondeo cada 15 s
    useEffect(() => {
        if (!isAuthenticated || conectado) return undefined;
        const id = setInterval(cargar, 15000);
        return () => clearInterval(id);
    }, [isAuthenticated, conectado, cargar]);

    let cuerpo;
    if (!loading && !isAuthenticated) {
        cuerpo = (
            <div className="gm-card gm-state">
                <img src="/icons/bud_smoking.png" alt="" width="88" height="88" />
                <h2>Entra para ver tus mensajes</h2>
                <p>Inicia sesión para chatear con tus amigos.</p>
                <button type="button" className="gm-btn gm-btn--primary" onClick={() => setShowAuth(true)}>Iniciar sesión o registrarme</button>
            </div>
        );
    } else if (error && !lista) {
        cuerpo = (
            <div className="gm-card gm-state" role="alert">
                <img src="/icons/bud_angry.png" alt="" width="88" height="88" />
                <h2>No pudimos cargar tus mensajes</h2>
                <p>{error}</p>
                <button type="button" className="gm-btn gm-btn--primary" onClick={cargar}><HiArrowPath size={16} aria-hidden="true" /> Reintentar</button>
            </div>
        );
    } else if (!lista) {
        cuerpo = (
            <div className="ex-loading" aria-busy="true" aria-label="Cargando conversaciones">
                {[0, 1, 2, 3].map((i) => <div key={i} className="gm-skel ex-skel-row" />)}
            </div>
        );
    } else if (lista.length === 0) {
        cuerpo = (
            <div className="gm-card gm-state">
                <img src="/icons/bud_map.png" alt="" width="88" height="88" />
                <h2>Todavía no hay conversaciones</h2>
                <p>Escríbele a un amigo desde su perfil o desde tu lista de amigos.</p>
                <Link to="/amigos" className="gm-btn gm-btn--primary"><HiUsers size={16} aria-hidden="true" /> Ir a mis amigos</Link>
            </div>
        );
    } else {
        cuerpo = (
            <ul className="am-lista" aria-label="Conversaciones">
                {lista.map((c) => {
                    const u = c.usuario || {};
                    const sin = c.noLeidos > 0;
                    return (
                        <li key={u.id}>
                            <Link
                                to={`/chat/${u.id}`} className={`gm-card am-fila am-conv${sin ? ' is-nuevo' : ''}`}
                                aria-label={`Conversación con ${u.username}${sin ? `, ${c.noLeidos} sin leer` : ''}`}
                            >
                                <AvatarUsuario usuario={u} size={48} />
                                <span className="am-info">
                                    <span className="am-info__top">
                                        <strong>{u.username}</strong>
                                        <time dateTime={c.fecha}>{tiempoCorto(c.fecha)}</time>
                                    </span>
                                    <span className="am-info__bottom">
                                        <small className="am-prev">{c.esMio ? 'Tú: ' : ''}{c.ultimoMensaje}</small>
                                        {sin && <span className="su-badge" aria-hidden="true">{c.noLeidos > 9 ? '9+' : c.noLeidos}</span>}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <main className="gm-page ex-page">
            <header className="ex-header">
                <div className="ex-header-inner">
                    <div className="am-titulo">
                        <button type="button" className="pu-icon" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/explorar'))} aria-label="Volver">
                            <HiArrowLeft size={20} aria-hidden="true" />
                        </button>
                        <div className="ex-title">
                            <h1>Mensajes</h1>
                            <p className="gm-sub">{conectado ? 'En tiempo real' : 'Tus conversaciones'}</p>
                        </div>
                        <Link to="/amigos" className="gm-btn gm-btn--sm am-msgs" aria-label="Elegir un amigo para escribirle">
                            <HiPencilSquare size={16} aria-hidden="true" /> Nuevo
                        </Link>
                    </div>
                </div>
            </header>
            <div className="gm-wrap ex-body">{cuerpo}</div>
            {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode />, document.body)}
        </main>
    );
};

export default ChatBandeja;
