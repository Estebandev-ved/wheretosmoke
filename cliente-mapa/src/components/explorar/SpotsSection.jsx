import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { HiArrowPath, HiStar, HiMapPin, HiSparkles, HiShieldExclamation, HiFire } from 'react-icons/hi2';
import { API_BASE } from '../../config';

const SpotDetailModal = lazy(() => import('../SpotDetailModal'));

// /spots devuelve { spot, votosRelax, ... } y trending/mejores/cercanos devuelven el spot plano
const normalizar = (item) => {
    if (!item) return null;
    const base = item.spot
        ? { ...item.spot, votosRelax: item.votosRelax ?? item.spot.votosRelax, votosTombo: item.votosTombo ?? item.spot.votosTombo }
        : item;
    if (!base.id || !base.nombre) return null;
    return base;
};
const normalizarLista = (data) => (Array.isArray(data) ? data.map(normalizar).filter(Boolean) : []);

const etiquetaCategoria = (c) => {
    if (!c) return '';
    const t = String(c).replace(/_/g, ' ').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
};

const distanciaM = (a, b, c, d) => {
    const R = 6371e3;
    const f1 = (a * Math.PI) / 180;
    const f2 = (c * Math.PI) / 180;
    const df = ((c - a) * Math.PI) / 180;
    const dl = ((d - b) * Math.PI) / 180;
    const x = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
const formatoDistancia = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

const SpotCardEx = ({ spot, ubicacion, onOpen, compacta }) => {
    const alerta = spot.estado === 'ROJO';
    const dist = ubicacion && spot.latitud && spot.longitud
        ? formatoDistancia(distanciaM(ubicacion[0], ubicacion[1], spot.latitud, spot.longitud))
        : null;
    const rating = spot.calificacionPromedio;
    return (
        <button
            type="button"
            className={`ex-spot ${compacta ? 'ex-spot--carousel' : ''}`}
            onClick={() => onOpen(spot)}
            aria-label={`${spot.nombre}, ${alerta ? 'con alerta de tombos' : 'zona relax'}. Ver detalle`}
        >
            <div className={`ex-spot-media ${alerta ? 'is-alerta' : 'is-relax'}`}>
                <img src={alerta ? '/icons/bud_police.png' : '/icons/bud_smoking.png'} alt="" loading="lazy" width="64" height="64" />
                <span className={`ex-state ${alerta ? 'is-alerta' : 'is-relax'}`}>
                    {alerta ? <HiShieldExclamation size={12} aria-hidden="true" /> : <HiSparkles size={12} aria-hidden="true" />}
                    {alerta ? 'Alerta' : 'Relax'}
                </span>
            </div>
            <div className="ex-spot-body">
                <h3 className="ex-spot-name">{spot.nombre}</h3>
                <div className="ex-spot-meta">
                    {spot.categoria && <span className="ex-cat">{etiquetaCategoria(spot.categoria)}</span>}
                    {spot.comuna && <span className="ex-comuna">{spot.comuna}</span>}
                    {dist && <span className="ex-dist"><HiMapPin size={12} aria-hidden="true" />{dist}</span>}
                </div>
                {spot.descubridorNombre && (
                    <span className="ex-desc">🏆 Descubierto por @{spot.descubridorNombre}</span>
                )}
                <div className="ex-spot-stats">
                    <span className="ex-rating" title="Calificación promedio">
                        <HiStar size={14} aria-hidden="true" />
                        {rating ? Number(rating).toFixed(1) : 'Sin calificar'}
                    </span>
                    <span className="ex-votes">
                        {spot.votosRelax ?? 0} relax · {spot.votosTombo ?? 0} tombo
                    </span>
                </div>
            </div>
        </button>
    );
};

const Carrusel = ({ titulo, icono, spots, ubicacion, onOpen }) => (
    <section className="ex-block" aria-label={titulo}>
        <div className="gm-section-title"><h2 className="ex-h2">{icono}{titulo}</h2></div>
        <ul className="ex-carousel">
            {spots.map((s) => (
                <li key={s.id}><SpotCardEx spot={s} ubicacion={ubicacion} onOpen={onOpen} compacta /></li>
            ))}
        </ul>
    </section>
);

const Esqueleto = () => (
    <div className="ex-loading" aria-busy="true" aria-label="Cargando spots">
        <div className="gm-skel ex-skel-chips" />
        <div className="ex-carousel">
            {[0, 1].map((i) => <div key={i} className="gm-skel ex-skel-card" />)}
        </div>
        <div className="gm-skel ex-skel-row" />
        <div className="gm-skel ex-skel-row" />
    </div>
);

const SpotsSection = ({ darkMode }) => {
    const [todos, setTodos] = useState([]);
    const [trending, setTrending] = useState([]);
    const [mejores, setMejores] = useState([]);
    const [cercanos, setCercanos] = useState([]);
    const [ubicacion, setUbicacion] = useState(null);
    const [permisoUbi, setPermisoUbi] = useState('idle'); // idle | pidiendo | denegado
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [categoria, setCategoria] = useState('TODAS');
    const [comuna, setComuna] = useState('TODAS');
    const [abierto, setAbierto] = useState(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(false);
        try {
            const [a, t, m] = await Promise.allSettled([
                axios.get(`${API_BASE}/spots`),
                axios.get(`${API_BASE}/spots/trending`),
                axios.get(`${API_BASE}/spots/mejores`),
            ]);
            if (a.status === 'rejected' && t.status === 'rejected' && m.status === 'rejected') throw new Error('sin datos');
            setTodos(a.status === 'fulfilled' ? normalizarLista(a.value.data) : []);
            setTrending(t.status === 'fulfilled' ? normalizarLista(t.value.data) : []);
            setMejores(m.status === 'fulfilled' ? normalizarLista(m.value.data) : []);
        } catch (e) {
            console.error('Error cargando spots:', e);
            setError(true);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const cargarCercanos = useCallback(async (pos) => {
        try {
            const { data } = await axios.get(`${API_BASE}/spots/cercanos`, { params: { lat: pos[0], lng: pos[1], radius: 10 } });
            setCercanos(normalizarLista(data));
        } catch {
            setCercanos([]);
        }
    }, []);

    const pedirUbicacion = useCallback(() => {
        if (!navigator.geolocation) { setPermisoUbi('denegado'); return; }
        setPermisoUbi('pidiendo');
        navigator.geolocation.getCurrentPosition(
            (p) => {
                const pos = [p.coords.latitude, p.coords.longitude];
                setUbicacion(pos);
                setPermisoUbi('idle');
                cargarCercanos(pos);
            },
            () => setPermisoUbi('denegado'),
            { timeout: 8000, maximumAge: 60000 }
        );
    }, [cargarCercanos]);

    // Si el permiso ya estaba concedido, se usa sin molestar
    useEffect(() => {
        let vivo = true;
        navigator.permissions?.query?.({ name: 'geolocation' }).then((r) => {
            if (vivo && r.state === 'granted') pedirUbicacion();
        }).catch(() => {});
        return () => { vivo = false; };
    }, [pedirUbicacion]);

    const categorias = useMemo(() => {
        const set = new Set();
        [...todos, ...trending, ...mejores].forEach((s) => s.categoria && set.add(s.categoria));
        return [...set].sort();
    }, [todos, trending, mejores]);

    const comunas = useMemo(() => {
        const set = new Set();
        [...todos, ...trending, ...mejores].forEach((s) => s.comuna && set.add(s.comuna));
        return [...set].sort((a, b) => a.localeCompare(b, 'es'));
    }, [todos, trending, mejores]);

    const filtra = (lista) => lista.filter((s) => (categoria === 'TODAS' || s.categoria === categoria) && (comuna === 'TODAS' || s.comuna === comuna));
    const lTrending = filtra(trending);
    const lMejores = filtra(mejores);
    const lCercanos = filtra(cercanos);
    const lTodos = filtra(todos);

    if (cargando) return <Esqueleto />;

    if (error) {
        return (
            <div className="gm-card gm-state" role="alert">
                <img src="/icons/bud_angry.png" alt="" width="88" height="88" />
                <h2>No pudimos cargar los spots</h2>
                <p>Revisa tu conexión e inténtalo otra vez.</p>
                <button type="button" className="gm-btn gm-btn--primary" onClick={cargar}>
                    <HiArrowPath size={16} aria-hidden="true" /> Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="ex-stack">
            {categorias.length > 0 && (
                <div className="ex-chips" role="group" aria-label="Filtrar por categoría">
                    {['TODAS', ...categorias].map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={`ex-chip ${categoria === c ? 'is-active' : ''}`}
                            aria-pressed={categoria === c}
                            onClick={() => setCategoria(c)}
                        >
                            {c === 'TODAS' ? 'Todas' : etiquetaCategoria(c)}
                        </button>
                    ))}
                </div>
            )}

            {comunas.length > 0 && (
                <div className="ex-chips" role="group" aria-label="Filtrar por comuna">
                    {['TODAS', ...comunas].map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={`ex-chip ex-chip--comuna ${comuna === c ? 'is-active' : ''}`}
                            aria-pressed={comuna === c}
                            onClick={() => setComuna(c)}
                        >
                            {c === 'TODAS' ? 'Todas las comunas' : c}
                        </button>
                    ))}
                </div>
            )}

            {lTrending.length > 0 && (
                <Carrusel titulo="Tendencia" icono={<HiFire size={18} className="ex-ico-fire" aria-hidden="true" />} spots={lTrending} ubicacion={ubicacion} onOpen={setAbierto} />
            )}
            {lMejores.length > 0 && (
                <Carrusel titulo="Mejor calificados" icono={<HiStar size={18} className="ex-ico-gold" aria-hidden="true" />} spots={lMejores} ubicacion={ubicacion} onOpen={setAbierto} />
            )}

            <section className="ex-block" aria-label="Cerca de ti">
                <div className="gm-section-title"><h2 className="ex-h2"><HiMapPin size={18} className="ex-ico-accent" aria-hidden="true" />Cerca de ti</h2></div>
                {ubicacion ? (
                    lCercanos.length > 0 ? (
                        <ul className="ex-carousel">
                            {lCercanos.map((s) => <li key={s.id}><SpotCardEx spot={s} ubicacion={ubicacion} onOpen={setAbierto} compacta /></li>)}
                        </ul>
                    ) : (
                        <div className="gm-card ex-note"><p>No hay spots en 10 km a tu alrededor. Mira la lista completa abajo.</p></div>
                    )
                ) : (
                    <div className="gm-card ex-note">
                        <p>
                            {permisoUbi === 'denegado'
                                ? 'No pudimos acceder a tu ubicación. Actívala en los permisos del navegador para ver spots cercanos.'
                                : 'Activa tu ubicación para ver los spots que tienes más cerca.'}
                        </p>
                        <button type="button" className="gm-btn gm-btn--sm" onClick={pedirUbicacion} disabled={permisoUbi === 'pidiendo'}>
                            <HiMapPin size={16} aria-hidden="true" /> {permisoUbi === 'pidiendo' ? 'Buscando...' : 'Usar mi ubicación'}
                        </button>
                    </div>
                )}
            </section>

            <section className="ex-block" aria-label="Todos los spots">
                <div className="gm-section-title"><h2 className="ex-h2">Todos los spots</h2><small>{lTodos.length}</small></div>
                {lTodos.length > 0 ? (
                    <ul className="ex-list">
                        {lTodos.map((s) => <li key={s.id}><SpotCardEx spot={s} ubicacion={ubicacion} onOpen={setAbierto} /></li>)}
                    </ul>
                ) : (
                    <div className="gm-card gm-state">
                        <img src="/icons/bud_map.png" alt="" width="88" height="88" />
                        <h2>{categoria === 'TODAS' && comuna === 'TODAS' ? 'Aún no hay spots' : 'Nada con ese filtro'}</h2>
                        <p>{categoria === 'TODAS' && comuna === 'TODAS' ? 'Toca el mapa para crear el primer spot de tu parche.' : 'Prueba con otro filtro o crea uno nuevo desde el mapa.'}</p>
                        {(categoria !== 'TODAS' || comuna !== 'TODAS') && <button type="button" className="gm-btn" onClick={() => { setCategoria('TODAS'); setComuna('TODAS'); }}>Quitar filtros</button>}
                    </div>
                )}
            </section>

            {abierto && (
                <Suspense fallback={null}>
                    {createPortal(<SpotDetailModal spot={abierto} darkMode={darkMode} onClose={() => setAbierto(null)} />, document.body)}
                </Suspense>
            )}
        </div>
    );
};

export default SpotsSection;
