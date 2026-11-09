import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HiLockClosed, HiCheckCircle, HiArrowPath, HiStar } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useGamificacion } from '../hooks/useGamificacion';
import { useGlobalSound } from '../context/SoundContext';
import { useParticles } from './ParticleEffects';
import { useToast } from './WeedToast';
import { createPortal } from 'react-dom';
import AuthModal from './AuthModal';
import ConfirmDialog from './ConfirmDialog';
import { getArticulos, mensajeError } from '../services/gamificacionApi';
import { resolveItemImage, RAREZAS, CATEGORIAS } from '../utils/itemImage';
import './gamificacion.css';
import './tienda.css';

const SkeletonTienda = () => (
    <div className="td-grid" aria-busy="true" aria-label="Cargando artículos">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="gm-skel" style={{ height: 230 }} />)}
    </div>
);

const TiendaPage = ({ darkMode = true }) => {
    const { user, token } = useAuth();
    const g = useGamificacion();
    const { sounds } = useGlobalSound();
    const particles = useParticles();
    const toast = useToast();

    const [articulos, setArticulos] = useState(null);
    const [error, setError] = useState(null);
    const [categoria, setCategoria] = useState('SKIN');
    const [showAuth, setShowAuth] = useState(false);
    const [aConfirmar, setAConfirmar] = useState(null);
    const [ocupado, setOcupado] = useState(null);
    const [comprado, setComprado] = useState(null);

    const cargar = useCallback(async () => {
        setError(null);
        try {
            setArticulos(await getArticulos(token));
        } catch (e) {
            setError(mensajeError(e, 'No pudimos cargar la tienda.'));
        }
    }, [token]);

    useEffect(() => { cargar(); }, [cargar]);

    const idsComprados = useMemo(() => new Set((g.inventario || []).map((a) => a.id)), [g.inventario]);
    const idsEquipados = useMemo(
        () => new Set(Object.values(g.equipadosItems || {}).filter(Boolean).map((a) => a.id)),
        [g.equipadosItems]
    );

    // Estado derivado de cada tarjeta (el contexto manda sobre lo que trajo el catálogo)
    const estadoDe = (a) => {
        const logueado = !!user && !g.esInvitado;
        const esComprado = logueado ? idsComprados.has(a.id) : false;
        const esEquipado = logueado ? idsEquipados.has(a.id) : false;
        const bloqueado = logueado ? g.nivel < a.nivelRequerido : false;
        if (!logueado) return 'invitado';
        if (esEquipado) return 'equipado';
        if (esComprado) return 'comprado';
        if (bloqueado) return 'bloqueado';
        if (g.monedas < a.precio) return 'sin-saldo';
        return 'comprar';
    };

    const destacado = useMemo(
        () => (articulos || []).find((a) => a.destacado && !idsComprados.has(a.id)),
        [articulos, idsComprados]
    );
    const visibles = useMemo(() => (articulos || []).filter((a) => a.categoria === categoria), [articulos, categoria]);

    const pedirCompra = (a) => {
        if (!user) { setShowAuth(true); return; }
        setAConfirmar(a);
    };

    const confirmarCompra = async () => {
        const a = aConfirmar;
        setAConfirmar(null);
        if (!a) return;
        setOcupado(a.id);
        try {
            await g.comprar(a.id);
            sounds.success();
            particles.achievement();
            setComprado(a);
        } catch (e) {
            sounds.error();
            toast.error(mensajeError(e));
            g.refresh();
            cargar();
        } finally {
            setOcupado(null);
        }
    };

    const alternarEquipo = async (a, equipar) => {
        setOcupado(a.id);
        try {
            if (equipar) await g.equipar(a.id); else await g.desequipar(a.id);
            sounds.click();
            toast.success(equipar ? `${a.nombre} equipado.` : `${a.nombre} desequipado.`);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setOcupado(null);
        }
    };

    const botonDe = (a) => {
        const est = estadoDe(a);
        const busy = ocupado === a.id;
        switch (est) {
            case 'equipado':
                return <button type="button" className="gm-btn gm-btn--sm gm-btn--block td-btn-eq" disabled={busy} onClick={() => alternarEquipo(a, false)} aria-label={`${a.nombre} equipado. Quitar`}><HiCheckCircle size={16} aria-hidden="true" /> Equipado</button>;
            case 'comprado':
                return <button type="button" className="gm-btn gm-btn--sm gm-btn--block" disabled={busy} onClick={() => alternarEquipo(a, true)} aria-label={`Equipar ${a.nombre}`}>{busy ? 'Equipando…' : 'Equipar'}</button>;
            case 'bloqueado':
                return <button type="button" className="gm-btn gm-btn--sm gm-btn--block" disabled aria-label={`${a.nombre} bloqueado hasta el nivel ${a.nivelRequerido}`}><HiLockClosed size={14} aria-hidden="true" /> Nivel {a.nivelRequerido}</button>;
            case 'sin-saldo':
                return <button type="button" className="gm-btn gm-btn--sm gm-btn--block" disabled aria-label={`Saldo insuficiente para ${a.nombre}`}>Saldo insuficiente</button>;
            default:
                return <button type="button" className="gm-btn gm-btn--gold gm-btn--sm gm-btn--block" disabled={busy} onClick={() => pedirCompra(a)} aria-label={`Comprar ${a.nombre} por ${a.precio} monedas`}>{busy ? 'Comprando…' : 'Comprar'}</button>;
        }
    };

    const rz = (a) => RAREZAS[a.rareza] || RAREZAS.COMUN;

    return (
        <main className="gm-page">
            <div className="gm-wrap">
                <div className="gm-head">
                    <div>
                        <h1>Tienda</h1>
                        <p className="gm-sub">Personaliza tu perfil con tus monedas.</p>
                    </div>
                    <div className="td-saldo">
                        {user && !g.esInvitado ? (
                            <>
                                <span className="gm-chip gm-chip--gold" aria-label={`Saldo: ${g.monedas} monedas`}><i className="gm-coin" aria-hidden="true" />{g.monedas}</span>
                                <span className="gm-chip" aria-label={`Nivel ${g.nivel}`}>Nivel {g.nivel}</span>
                            </>
                        ) : (
                            <button type="button" className="gm-btn gm-btn--sm gm-btn--primary" onClick={() => setShowAuth(true)}>Iniciar sesión</button>
                        )}
                    </div>
                </div>

                <p className="td-nota">Las monedas se ganan jugando (check-in, misiones y ayudando a la comunidad). No se compran con dinero real.</p>

                {destacado && (
                    <section className={`td-banner gm-r-${rz(destacado).clase}`} aria-label="Artículo destacado">
                        <img src={resolveItemImage(destacado.imagen)} alt="" />
                        <div className="td-banner-txt">
                            <span className="gm-rarity"><HiStar size={11} aria-hidden="true" /> Destacado · {rz(destacado).label}</span>
                            <h2>{destacado.nombre}</h2>
                            <p>{destacado.descripcion}</p>
                            <div className="td-banner-act">
                                <span className="gm-chip gm-chip--gold"><i className="gm-coin" aria-hidden="true" />{destacado.precio}</span>
                                <div className="td-banner-btn">{botonDe(destacado)}</div>
                            </div>
                        </div>
                    </section>
                )}

                <div className="td-tabs" role="tablist" aria-label="Categorías">
                    {CATEGORIAS.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            role="tab"
                            id={`tab-${c.id}`}
                            aria-selected={categoria === c.id}
                            aria-controls="td-panel"
                            className={`td-tab ${categoria === c.id ? 'is-active' : ''}`}
                            onClick={() => setCategoria(c.id)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                <div id="td-panel" role="tabpanel" aria-labelledby={`tab-${categoria}`}>
                    {error && !articulos ? (
                        <div className="gm-card gm-state" role="alert">
                            <img src="/icons/bud_angry.png" alt="" />
                            <h2>No pudimos abrir la tienda</h2>
                            <p>{error}</p>
                            <button type="button" className="gm-btn gm-btn--primary" onClick={cargar}><HiArrowPath size={16} aria-hidden="true" /> Reintentar</button>
                        </div>
                    ) : !articulos ? (
                        <SkeletonTienda />
                    ) : visibles.length === 0 ? (
                        <div className="gm-card gm-state"><img src="/icons/bud_map.png" alt="" /><p>Todavía no hay artículos en esta categoría. Pronto llegan más.</p></div>
                    ) : (
                        <ul className="td-grid">
                            {visibles.map((a) => {
                                const est = estadoDe(a);
                                return (
                                    <li key={a.id} className={`td-card gm-r-${rz(a).clase} ${est === 'equipado' ? 'is-equipped' : ''} ${est === 'bloqueado' ? 'is-locked' : ''}`}>
                                        <span className="gm-rarity td-rarity">{rz(a).label}</span>
                                        <div className="td-img"><img src={resolveItemImage(a.imagen)} alt={a.nombre} loading="lazy" /></div>
                                        <h3>{a.nombre}</h3>
                                        <p>{a.descripcion}</p>
                                        <div className="td-precio">
                                            {est === 'comprado' || est === 'equipado'
                                                ? <span className="td-poseido">En tu colección</span>
                                                : <span className="gm-chip gm-chip--gold"><i className="gm-coin" aria-hidden="true" />{a.precio}</span>}
                                            {a.nivelRequerido > 1 && est !== 'comprado' && est !== 'equipado' && <small>Nivel {a.nivelRequerido}</small>}
                                        </div>
                                        {botonDe(a)}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!aConfirmar}
                type="info"
                title="Confirmar compra"
                message={aConfirmar ? `¿Comprar "${aConfirmar.nombre}" por ${aConfirmar.precio} monedas? Te quedarán ${Math.max(0, g.monedas - aConfirmar.precio)}.` : ''}
                confirmText="Comprar"
                cancelText="Cancelar"
                onConfirm={confirmarCompra}
                onCancel={() => setAConfirmar(null)}
            />

            {comprado && (
                <div className="gm-modal" role="dialog" aria-modal="true" aria-labelledby="td-ok-title" onClick={() => setComprado(null)}>
                    <div className={`gm-modal-card gm-r-${rz(comprado).clase} td-exito`} onClick={(e) => e.stopPropagation()}>
                        <img src={resolveItemImage(comprado.imagen)} alt="" className="td-exito-img" />
                        <span className="gm-rarity">{rz(comprado).label}</span>
                        <h2 id="td-ok-title">¡{comprado.nombre} es tuyo!</h2>
                        <p>Ya está en tu colección. Te quedan {g.monedas} monedas.</p>
                        <div className="td-exito-act">
                            <button type="button" className="gm-btn" onClick={() => setComprado(null)}>Seguir viendo</button>
                            <button type="button" className="gm-btn gm-btn--primary" autoFocus onClick={() => { const a = comprado; setComprado(null); alternarEquipo(a, true); }}>Equipar ahora</button>
                        </div>
                    </div>
                </div>
            )}

            {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode={darkMode} />, document.body)}
        </main>
    );
};

export default TiendaPage;
