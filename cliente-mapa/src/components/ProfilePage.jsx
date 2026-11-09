import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUser, HiRocketLaunch, HiInformationCircle, HiSparkles, HiShoppingBag, HiArrowPath, HiArrowRightOnRectangle, HiTrophy, HiPlayCircle, HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useGamificacion } from '../hooks/useGamificacion';
import { useGlobalSound } from '../context/SoundContext';
import { useToast } from './WeedToast';
import { createPortal } from 'react-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import IndicadorPull from './fx/IndicadorPull';
import EstadoVacio from './fx/EstadoVacio';
import { emitir } from '../utils/eventosJuego';
import './fx/fx.css';
import AuthModal from './AuthModal';
import CofreDiario from './CofreDiario';
import AlbumComunas from './AlbumComunas';
import { InsigniaX2 } from './HoraFeliz';
import CharacterAvatar from './CharacterAvatar';
import { getBadges, mensajeError } from '../services/gamificacionApi';
import { resolveItemImage, avatarPorGenero, RAREZAS, ORDEN_RAREZA, CATEGORIAS } from '../utils/itemImage';
import './gamificacion.css';
import './tienda.css';
import './profile-page.css';

const UserProfile = lazy(() => import('./UserProfile'));

const ProfilePage = ({ darkMode = true, onChatClick }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const g = useGamificacion();
    const { sounds, soundEnabled, toggleSound } = useGlobalSound();
    const toast = useToast();

    const [showProfile, setShowProfile] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [badges, setBadges] = useState([]);
    const [catActiva, setCatActiva] = useState('SKIN');
    const [vista, setVista] = useState({}); // categoría -> artículo en vista previa (o null = sin equipar)
    const [ocupado, setOcupado] = useState(false);
    const [albumVersion, setAlbumVersion] = useState(0);

    useEffect(() => {
        getBadges().then(setBadges).catch(() => setBadges([]));
    }, []);

    const { bind, pull, refrescando } = usePullToRefresh(() =>
        Promise.all([g.refresh(), getBadges().then(setBadges).catch(() => {}), setAlbumVersion((v) => v + 1)]));

    const eq = g.equipadosItems || {};
    // Lo que se ve en el avatar: la vista previa manda sobre lo equipado
    const mostrado = (cat) => (cat in vista ? vista[cat] : eq[cat]);
    const skinImg = mostrado('SKIN')?.imagen || avatarPorGenero(user?.genero);

    const porRareza = useMemo(() => {
        const mapa = {};
        (g.inventario || []).forEach((a) => { (mapa[a.rareza] = mapa[a.rareza] || []).push(a); });
        return mapa;
    }, [g.inventario]);

    const delaCategoria = useMemo(() => (g.inventario || []).filter((a) => a.categoria === catActiva), [g.inventario, catActiva]);

    const ganadas = useMemo(() => {
        const ids = g.perfil?.badgesGanados || [];
        return ids.slice(-4).reverse().map((id) => badges.find((b) => b.id === id) || { id, nombre: id, descripcion: '' });
    }, [g.perfil, badges]);

    const accesos = (
        <div className="pf-accesos">
            <button type="button" className="profile-item" onClick={() => navigate('/descubrir')}>
                <HiRocketLaunch size={20} aria-hidden="true" />
                <span>Descubrir<small>Spots sugeridos para ti</small></span>
            </button>
            <button type="button" className="profile-item" onClick={() => onChatClick && onChatClick()}>
                <HiSparkles size={20} aria-hidden="true" />
                <span>Asistente IA<small>Pregunta por spots y recomendaciones</small></span>
            </button>
            <button type="button" className="profile-item" onClick={() => emitir('tour:abrir')}>
                <HiPlayCircle size={20} aria-hidden="true" />
                <span>Ver tour de nuevo<small>Repasa cómo funciona la app</small></span>
            </button>
            <button
                type="button"
                role="switch"
                aria-checked={soundEnabled}
                className="fx-switch"
                onClick={() => { toggleSound(); }}
            >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    {soundEnabled ? <HiSpeakerWave size={20} aria-hidden="true" /> : <HiSpeakerXMark size={20} aria-hidden="true" />}
                    Sonido y efectos
                </span>
                <span className="fx-switch__track" aria-hidden="true" />
            </button>
            <button type="button" className="profile-item" onClick={() => navigate('/nosotros')}>
                <HiInformationCircle size={20} aria-hidden="true" />
                <span>Quiénes somos<small>Sobre WhereToSmoke</small></span>
            </button>
        </div>
    );

    if (!user) {
        return (
            <main className="gm-page">
                <div className="gm-wrap">
                    <div className="gm-head"><div><h1>Tu perfil</h1><p className="gm-sub">Tu personaje, tu colección y tu actividad.</p></div></div>
                    <div className="gm-card gm-state">
                        <CharacterAvatar size={110} skin="/icons/bud_smoking.png" alt="Personaje de invitado" />
                        <h2>Crea tu perfil</h2>
                        <p>Inicia sesión para guardar tu progreso, ganar monedas y personalizar tu personaje.</p>
                        <button type="button" className="gm-btn gm-btn--primary" onClick={() => setShowAuth(true)}>Iniciar sesión o registrarme</button>
                    </div>
                    <CofreDiario compacto onLogin={() => setShowAuth(true)} />
                    {accesos}
                </div>
                {createPortal(<AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} darkMode={darkMode} />, document.body)}
            </main>
        );
    }

    if (g.cargando && !g.perfil) {
        return (
            <main className="gm-page">
                <div className="gm-wrap" aria-busy="true" aria-label="Cargando perfil">
                    <div className="gm-skel" style={{ height: 190 }} />
                    <div className="gm-skel" style={{ height: 90 }} />
                    <div className="gm-skel" style={{ height: 240 }} />
                </div>
            </main>
        );
    }

    if (g.error && !g.perfil) {
        return (
            <main className="gm-page">
                <div className="gm-wrap">
                    <div className="gm-card gm-state" role="alert">
                        <img src="/icons/bud_angry.png" alt="" />
                        <h2>No pudimos cargar tu perfil</h2>
                        <p>{g.error}</p>
                        <button type="button" className="gm-btn gm-btn--primary" onClick={g.refresh}><HiArrowPath size={16} aria-hidden="true" /> Reintentar</button>
                    </div>
                </div>
            </main>
        );
    }

    const p = g.perfil || {};
    const xpBase = g.xpNivelActual ?? 0;
    const xpTope = g.xpSiguienteNivel;
    const pct = xpTope ? Math.max(0, Math.min(100, ((g.xp - xpBase) / Math.max(1, xpTope - xpBase)) * 100)) : 100;

    const stats = [
        { v: p.spotsCreados ?? 0, l: 'Spots creados' },
        { v: p.reportesHechos ?? 0, l: 'Reportes y votos' },
        { v: p.fotosSubidas ?? 0, l: 'Fotos subidas' },
        { v: p.comentariosHechos ?? 0, l: 'Comentarios' },
        { v: g.rachaDias, l: g.rachaDias === 1 ? 'Día de racha' : 'Días de racha' },
    ];

    const aplicar = async (item, equipar) => {
        setOcupado(true);
        try {
            if (equipar) await g.equipar(item.id); else await g.desequipar(item.id);
            sounds.click();
            toast.success(equipar ? `${item.nombre} equipado.` : `${item.nombre} desequipado.`);
            setVista((v) => { const n = { ...v }; delete n[item.categoria]; return n; });
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setOcupado(false);
        }
    };

    const equipadoCat = eq[catActiva];
    const enVista = catActiva in vista ? vista[catActiva] : undefined;
    const seleccionado = enVista === undefined ? equipadoCat : enVista;

    return (
        <main className="gm-page" {...bind}>
            <IndicadorPull pull={pull} refrescando={refrescando} />
            <div className="gm-wrap">
                {/* Cabecera */}
                <section className="gm-card pf-hero" aria-label="Tu personaje">
                    <CharacterAvatar size={132} skin={skinImg} marco={mostrado('MARCO')} mascota={mostrado('MASCOTA')} alt={`Avatar de ${user.username}`} />
                    <div className="pf-hero-info">
                        <h1>{user.username}</h1>
                        <div className="pf-hero-chips">
                            <span className="gm-chip gm-chip--accent">{g.tituloRango}</span>
                            <span className="gm-chip">Nivel {g.nivel}</span>
                            <span className="gm-chip gm-chip--gold" aria-label={`${g.monedas} monedas`}><i className="gm-coin" aria-hidden="true" />{g.monedas}<InsigniaX2 /></span>
                        </div>
                        <div className="gm-bar gm-bar--thin" role="progressbar" aria-valuemin={xpBase} aria-valuemax={xpTope || g.xp} aria-valuenow={g.xp} aria-label="Experiencia">
                            <span style={{ width: `${pct}%` }} />
                        </div>
                        <small className="gm-sub">{xpTope ? `${g.xp} / ${xpTope} XP` : `${g.xp} XP · nivel máximo`}</small>
                    </div>
                </section>

                {/* Estadísticas */}
                <section aria-label="Estadísticas">
                    <ul className="pf-stats">
                        {stats.map((s) => (
                            <li key={s.l}><strong>{s.v}</strong><span>{s.l}</span></li>
                        ))}
                    </ul>
                </section>

                <CofreDiario compacto />

                <AlbumComunas version={albumVersion} />

                {/* Vestidor */}
                <section className="gm-card" aria-label="Vestidor">
                    <div className="gm-section-title"><h2>Vestidor</h2><small>Prueba y equipa lo que ya tienes</small></div>
                    <div className="td-tabs" role="tablist" aria-label="Categorías del vestidor">
                        {CATEGORIAS.map((c) => (
                            <button key={c.id} type="button" role="tab" aria-selected={catActiva === c.id} className={`td-tab ${catActiva === c.id ? 'is-active' : ''}`} onClick={() => setCatActiva(c.id)}>
                                {c.label}
                            </button>
                        ))}
                    </div>
                    {delaCategoria.length === 0 ? (
                        <div className="pf-vacio">
                            <p>Aún no tienes artículos de esta categoría.</p>
                            <button type="button" className="gm-btn gm-btn--sm" onClick={() => navigate('/tienda')}><HiShoppingBag size={16} aria-hidden="true" /> Ir a la tienda</button>
                        </div>
                    ) : (
                        <>
                            <ul className="pf-items" role="listbox" aria-label="Artículos de la categoría">
                                {delaCategoria.map((a, i) => {
                                    const r = RAREZAS[a.rareza] || RAREZAS.COMUN;
                                    const activo = seleccionado?.id === a.id;
                                    return (
                                        <li key={a.id} className="fx-in" style={{ '--i': i }}>
                                            <button type="button" role="option" aria-selected={activo} className={`pf-item gm-r-${r.clase} ${activo ? 'is-sel' : ''}`} onClick={() => setVista((v) => ({ ...v, [catActiva]: a }))} aria-label={`${a.nombre}, ${r.label}${equipadoCat?.id === a.id ? ', equipado' : ''}`}>
                                                <img src={resolveItemImage(a.imagen)} alt="" />
                                                <span>{a.nombre}</span>
                                                {equipadoCat?.id === a.id && <em>Equipado</em>}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="pf-acciones">
                                {seleccionado && equipadoCat?.id === seleccionado.id ? (
                                    <button type="button" className="gm-btn" disabled={ocupado} onClick={() => aplicar(seleccionado, false)}>Quitar {seleccionado.nombre}</button>
                                ) : seleccionado ? (
                                    <button type="button" className="gm-btn gm-btn--primary" disabled={ocupado} onClick={() => aplicar(seleccionado, true)}>{ocupado ? 'Equipando…' : `Equipar ${seleccionado.nombre}`}</button>
                                ) : (
                                    <span className="gm-sub">Elige un artículo para verlo en tu avatar.</span>
                                )}
                                {Object.keys(vista).length > 0 && (
                                    <button type="button" className="gm-btn gm-btn--sm" onClick={() => setVista({})}>Descartar vista previa</button>
                                )}
                            </div>
                        </>
                    )}
                </section>

                {/* Mi colección */}
                <section aria-label="Mi colección">
                    <div className="gm-section-title"><h2>Mi colección</h2><small>{(g.inventario || []).length} artículos</small></div>
                    {(g.inventario || []).length === 0 ? (
                        <EstadoVacio texto="Tu colección está vacía. Gana monedas con check-ins y misiones y estrénala en la tienda.">
                            <button type="button" className="gm-btn gm-btn--primary" onClick={() => navigate('/tienda')}>Ver la tienda</button>
                        </EstadoVacio>
                    ) : (
                        <div className="pf-coleccion">
                            {ORDEN_RAREZA.filter((r) => porRareza[r]?.length).map((r) => (
                                <div key={r} className={`pf-rareza gm-r-${RAREZAS[r].clase}`}>
                                    <div className="pf-rareza-h"><span className="gm-rarity">{RAREZAS[r].label}</span><small>{porRareza[r].length}</small></div>
                                    <ul>
                                        {porRareza[r].map((a) => (
                                            <li key={a.id} title={`${a.nombre} (${CATEGORIAS.find((c) => c.id === a.categoria)?.singular || a.categoria})`}>
                                                <img src={resolveItemImage(a.imagen)} alt={a.nombre} loading="lazy" />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Insignias recientes */}
                <section aria-label="Insignias recientes">
                    <div className="gm-section-title"><h2>Insignias recientes</h2><button type="button" className="gm-btn gm-btn--sm" onClick={() => navigate('/misiones')}>Ver todas</button></div>
                    {ganadas.length === 0 ? (
                        <EstadoVacio texto="Todavía no tienes insignias. Completa misiones y ayuda a la comunidad para ganarlas." />
                    ) : (
                        <ul className="pf-badges">
                            {ganadas.map((b) => (
                                <li key={b.id}><span aria-hidden="true"><HiTrophy size={20} /></span><div><strong>{b.nombre}</strong><small>{b.descripcion}</small></div></li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Accesos */}
                <section aria-label="Accesos">
                    <div className="pf-accesos">
                        <button type="button" className="profile-item profile-item--primary" onClick={() => setShowProfile(true)}>
                            <HiUser size={20} aria-hidden="true" />
                            <span>Mi cuenta<small>Favoritos, notificaciones y ajustes</small></span>
                        </button>
                    </div>
                    {accesos}
                    <button type="button" className="gm-btn gm-btn--block pf-salir" onClick={() => { logout(); toast.success('Hasta pronto.'); }}>
                        <HiArrowRightOnRectangle size={18} aria-hidden="true" /> Cerrar sesión
                    </button>
                </section>
            </div>

            {showProfile && (
                <Suspense fallback={null}>
                    <UserProfile darkMode={darkMode} isOpen={showProfile} onClose={() => setShowProfile(false)} />
                </Suspense>
            )}
        </main>
    );
};

export default ProfilePage;
