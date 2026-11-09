import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { HiArrowPath, HiChatBubbleOvalLeft, HiHeart, HiMapPin, HiPaperAirplane, HiXMark, HiSparkles, HiShieldExclamation } from 'react-icons/hi2';
import { API_BASE } from '../../config';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../AuthModal';
import ReaccionesBar from '../ReaccionesBar';
import { reaccionarFoto } from '../../services/socialApi';

const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const tiempoRelativo = (iso) => {
    if (!iso) return '';
    const fecha = new Date(iso);
    const s = Math.floor((Date.now() - fecha) / 1000);
    if (s < 60) return 'Ahora';
    if (s < 3600) return `Hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `Hace ${Math.floor(s / 3600)} h`;
    if (s < 604800) return `Hace ${Math.floor(s / 86400)} d`;
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

const iniciales = (n) => (n ? n.split(/\s+/).map((p) => p[0]).join('').toUpperCase().slice(0, 2) : '?');

const Esqueleto = () => (
    <div className="ex-loading" aria-busy="true" aria-label="Cargando publicaciones">
        {[0, 1].map((i) => (
            <div key={i} className="gm-card ex-post ex-post--skel">
                <div className="ex-post-head">
                    <div className="gm-skel ex-skel-avatar" />
                    <div className="ex-skel-lines"><div className="gm-skel" /><div className="gm-skel" /></div>
                </div>
                <div className="gm-skel ex-skel-photo" />
            </div>
        ))}
    </div>
);

const FeedSection = () => {
    const { isAuthenticated } = useAuth();
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [liked, setLiked] = useState({});
    const [animando, setAnimando] = useState(null);
    const [enviandoLike, setEnviandoLike] = useState(null);
    const [sheet, setSheet] = useState(null); // foto cuyos comentarios se ven
    const [comentarios, setComentarios] = useState({});
    const [cargandoCom, setCargandoCom] = useState(false);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const inputRef = useRef(null);
    const cerrarRef = useRef(null);
    const dispararRef = useRef(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(false);
        try {
            const { data: spots } = await axios.get(`${API_BASE}/spots`);
            const conFotos = (Array.isArray(spots) ? spots : [])
                .filter((d) => d.spot && d.spot.cantidadFotos > 0)
                .slice(0, 15);
            const resultados = await Promise.allSettled(conFotos.map(async (d) => {
                const { data: fotos } = await axios.get(`${API_BASE}/spots/${d.spot.id}/fotos`);
                return fotos.map((f) => ({ ...f, spotNombre: d.spot.nombre, spotEstado: d.spot.estado }));
            }));
            if (conFotos.length > 0 && resultados.every((r) => r.status === 'rejected')) throw new Error('sin fotos');
            const todas = resultados
                .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
                .sort((a, b) => new Date(b.fechaSubida) - new Date(a.fechaSubida))
                .slice(0, 30);
            setItems(todas);
        } catch (e) {
            console.error('Error cargando feed:', e);
            setError(true);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const darLike = async (foto) => {
        if (!isAuthenticated) { setShowAuth(true); return; }
        if (enviandoLike === foto.id) return;
        setEnviandoLike(foto.id);
        try {
            const { data } = await axios.post(`${API_BASE}/fotos/${foto.id}/like`, {}, { headers: authHeaders() });
            setItems((prev) => prev.map((i) => (i.id === foto.id ? { ...i, likes: data.likes } : i)));
            setLiked((prev) => ({ ...prev, [foto.id]: data.liked }));
            if (data.liked) {
                setAnimando(foto.id);
                setTimeout(() => setAnimando((a) => (a === foto.id ? null : a)), 700);
            }
        } catch (e) {
            console.error('Error dando like:', e);
        } finally {
            setEnviandoLike(null);
        }
    };

    // Reacción optimista: un emoji por persona; el mismo lo quita, otro lo reemplaza. Rollback si falla.
    const reaccionar = async (foto, emoji) => {
        if (!isAuthenticated) { setShowAuth(true); return; }
        const previo = { reacciones: foto.reacciones || {}, miReaccion: foto.miReaccion || null };
        const nuevas = { ...previo.reacciones };
        if (previo.miReaccion) nuevas[previo.miReaccion] = Math.max(0, (nuevas[previo.miReaccion] || 1) - 1);
        const quita = previo.miReaccion === emoji;
        if (!quita) nuevas[emoji] = (nuevas[emoji] || 0) + 1;
        const aplicar = (reacciones, miReaccion) =>
            setItems((prev) => prev.map((i) => (i.id === foto.id ? { ...i, reacciones, miReaccion } : i)));
        aplicar(nuevas, quita ? null : emoji);
        try {
            const data = await reaccionarFoto(foto.id, emoji);
            aplicar(data.reacciones || {}, data.miReaccion ?? null);
        } catch (e) {
            console.error('Error reaccionando:', e);
            aplicar(previo.reacciones, previo.miReaccion);
        }
    };

    const abrirComentarios = async (foto, ev) => {
        dispararRef.current = ev?.currentTarget || null;
        setSheet(foto);
        setTexto('');
        if (!comentarios[foto.id]) {
            setCargandoCom(true);
            try {
                const { data } = await axios.get(`${API_BASE}/fotos/${foto.id}/comentarios`);
                setComentarios((p) => ({ ...p, [foto.id]: data }));
            } catch {
                setComentarios((p) => ({ ...p, [foto.id]: [] }));
            } finally {
                setCargandoCom(false);
            }
        }
    };

    const cerrarSheet = useCallback(() => {
        setSheet(null);
        dispararRef.current?.focus?.();
    }, []);

    useEffect(() => {
        if (!sheet) return undefined;
        cerrarRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') cerrarSheet(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [sheet, cerrarSheet]);

    const enviarComentario = async (e) => {
        e.preventDefault();
        const t = texto.trim();
        if (!t || !sheet) return;
        if (!isAuthenticated) { setShowAuth(true); return; }
        setEnviando(true);
        try {
            const { data } = await axios.post(`${API_BASE}/fotos/${sheet.id}/comentarios`, { texto: t }, { headers: authHeaders() });
            setComentarios((p) => ({ ...p, [sheet.id]: [data, ...(p[sheet.id] || [])] }));
            setTexto('');
        } catch (err) {
            console.error('Error agregando comentario:', err);
        } finally {
            setEnviando(false);
        }
    };

    if (cargando) return <Esqueleto />;

    if (error) {
        return (
            <div className="gm-card gm-state" role="alert">
                <img src="/icons/bud_angry.png" alt="" width="88" height="88" />
                <h2>No pudimos cargar el feed</h2>
                <p>Revisa tu conexión e inténtalo otra vez.</p>
                <button type="button" className="gm-btn gm-btn--primary" onClick={cargar}>
                    <HiArrowPath size={16} aria-hidden="true" /> Reintentar
                </button>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="gm-card gm-state">
                <img src="/icons/bud_map.png" alt="" width="88" height="88" />
                <h2>Todavía no hay fotos</h2>
                <p>Sé el primero en compartir una foto de un spot. Entra a un spot desde el mapa y súbela.</p>
            </div>
        );
    }

    const listaCom = sheet ? comentarios[sheet.id] || [] : [];

    return (
        <>
            <ul className="ex-feed">
                {items.map((f) => {
                    const meGusta = liked[f.id] === true;
                    const alerta = f.spotEstado === 'ROJO';
                    return (
                        <li key={f.id} className="gm-card ex-post">
                            <div className="ex-post-head">
                                <div className="ex-post-avatar" aria-hidden="true">{iniciales(f.usuarioNombre)}</div>
                                <div className="ex-post-who">
                                    <strong>{f.usuarioNombre || 'Anónimo'}</strong>
                                    <span className="ex-post-spot">
                                        <HiMapPin size={12} aria-hidden="true" />
                                        <span className="ex-post-spotname">{f.spotNombre || 'Spot'}</span>
                                        <span className={`ex-state ex-state--inline ${alerta ? 'is-alerta' : 'is-relax'}`}>
                                            {alerta ? <HiShieldExclamation size={10} aria-hidden="true" /> : <HiSparkles size={10} aria-hidden="true" />}
                                            {alerta ? 'Alerta' : 'Relax'}
                                        </span>
                                    </span>
                                </div>
                                <time className="ex-post-time" dateTime={f.fechaSubida}>{tiempoRelativo(f.fechaSubida)}</time>
                            </div>

                            {f.imageData && (
                                <div className="ex-post-photo" onDoubleClick={() => darLike(f)}>
                                    <img src={f.imageData} alt={f.descripcion || `Foto en ${f.spotNombre || 'un spot'}`} loading="lazy" decoding="async" width="600" height="600" />
                                    {animando === f.id && <HiHeart className="ex-burst" size={84} aria-hidden="true" />}
                                </div>
                            )}

                            <div className="ex-post-actions">
                                <button
                                    type="button"
                                    className={`ex-act ${meGusta ? 'is-liked' : ''}`}
                                    onClick={() => darLike(f)}
                                    aria-pressed={meGusta}
                                    aria-label={`Me gusta, ${f.likes || 0} ${f.likes === 1 ? 'persona' : 'personas'}`}
                                >
                                    <HiHeart size={22} className={animando === f.id ? 'ex-pop' : ''} aria-hidden="true" />
                                    <span>{f.likes || 0}</span>
                                </button>
                                <button type="button" className="ex-act" onClick={(e) => abrirComentarios(f, e)} aria-label="Ver y escribir comentarios">
                                    <HiChatBubbleOvalLeft size={22} aria-hidden="true" />
                                    <span>{comentarios[f.id] ? comentarios[f.id].length : 'Comentar'}</span>
                                </button>
                            </div>

                            <ReaccionesBar reacciones={f.reacciones} miReaccion={f.miReaccion} onReaccionar={(e) => reaccionar(f, e)} />

                            {f.descripcion && (
                                <p className="ex-post-desc"><strong>{f.usuarioNombre || 'Anónimo'}</strong> {f.descripcion}</p>
                            )}
                        </li>
                    );
                })}
            </ul>

            {sheet && createPortal(
                <div className="ex-sheet-wrap" onClick={cerrarSheet}>
                    <div className="ex-sheet" role="dialog" aria-modal="true" aria-label="Comentarios" onClick={(e) => e.stopPropagation()}>
                        <div className="ex-sheet-grab" aria-hidden="true" />
                        <div className="ex-sheet-head">
                            <h2>Comentarios</h2>
                            <button ref={cerrarRef} type="button" className="ex-sheet-close" onClick={cerrarSheet} aria-label="Cerrar comentarios">
                                <HiXMark size={20} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="ex-sheet-list" aria-live="polite">
                            {cargandoCom ? (
                                <>
                                    <div className="gm-skel ex-skel-com" />
                                    <div className="gm-skel ex-skel-com" />
                                </>
                            ) : listaCom.length > 0 ? (
                                listaCom.map((c, i) => (
                                    <div key={c.id || i} className="ex-com">
                                        <div className="ex-post-avatar ex-post-avatar--sm" aria-hidden="true">{iniciales(c.usuarioNombre)}</div>
                                        <div className="ex-com-body">
                                            <div><strong>{c.usuarioNombre || 'Anónimo'}</strong> <small>{tiempoRelativo(c.fecha)}</small></div>
                                            <p>{c.texto}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="ex-sheet-empty">Aún no hay comentarios. Escribe el primero.</p>
                            )}
                        </div>
                        {isAuthenticated ? (
                            <form className="ex-sheet-form" onSubmit={enviarComentario}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={texto}
                                    onChange={(e) => setTexto(e.target.value)}
                                    placeholder="Escribe un comentario"
                                    aria-label="Escribe un comentario"
                                    maxLength={300}
                                />
                                <button type="submit" className="ex-send" disabled={enviando || !texto.trim()} aria-label="Enviar comentario">
                                    <HiPaperAirplane size={18} aria-hidden="true" />
                                </button>
                            </form>
                        ) : (
                            <div className="ex-sheet-login">
                                <p>Inicia sesión para comentar y dar me gusta.</p>
                                <button type="button" className="gm-btn gm-btn--primary" onClick={() => setShowAuth(true)}>Iniciar sesión</button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode />, document.body)}
        </>
    );
};

export default FeedSection;
