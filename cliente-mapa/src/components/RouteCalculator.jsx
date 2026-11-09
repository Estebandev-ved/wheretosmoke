import { API_BASE } from '../config';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    HiMapPin, HiClock, HiShieldCheck, HiShieldExclamation, HiExclamationTriangle,
    HiPlay, HiArrowsRightLeft, HiMagnifyingGlass, HiCursorArrowRays, HiViewfinderCircle,
    HiMap, HiTrash,
} from 'react-icons/hi2';
import BottomSheet from './BottomSheet';
import './gamificacion.css';
import './RouteCalculator.css';

const API_BASE_URL = API_BASE;

const formatearTiempo = (segundos) => {
    const minutos = Math.max(1, Math.round(segundos / 60));
    if (minutos < 60) return `${minutos} min`;
    return `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
};

const formatearDistancia = (metros) => (metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1)} km`);

/** Severidad según reportes policiales cercanos (misma regla de siempre). */
const severidad = (n) => {
    if (n === 0) return { clase: 'ok', texto: 'Ruta segura', detalle: 'Sin reportes policiales cerca', Icono: HiShieldCheck };
    if (n <= 2) return { clase: 'warn', texto: 'Precaución', detalle: 'Hay reportes cerca del trayecto', Icono: HiExclamationTriangle };
    return { clase: 'bad', texto: 'Peligrosa', detalle: 'Varios reportes policiales en el trayecto', Icono: HiShieldExclamation };
};

/**
 * Calculador de ruta de bajo perfil (hoja inferior).
 * Props nuevas: destinoSpot {lat,lng,nombre}, spots [{id,nombre,lat,lng}], rutaInicial.
 * Contrato con el mapa (sin cambios): onModeChange(0|1|2) y window.handleRouteMapClick.
 */
export default function RouteCalculator({
    userLocation, onRouteCalculated, onModeChange, onSimulationStart, onClose,
    destinoSpot = null, spots = [], rutaInicial = null,
}) {
    const [origen, setOrigen] = useState(null);
    const [destino, setDestino] = useState(null);
    const [direccionOrigen, setDireccionOrigen] = useState('');
    const [direccionDestino, setDireccionDestino] = useState('');
    const [ruta, setRuta] = useState(destinoSpot ? null : rutaInicial);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [paso, setPaso] = useState(0); // 0=inactivo, 1=tocar origen en el mapa, 2=tocar destino en el mapa
    const [busqueda, setBusqueda] = useState('');

    const origenRef = useRef(null);
    const destinoRef = useRef(null);
    const pasoRef = useRef(0);
    const modeCb = useRef(onModeChange);
    const routeCb = useRef(onRouteCalculated);
    useEffect(() => { modeCb.current = onModeChange; routeCb.current = onRouteCalculated; });

    const fijarOrigen = useCallback((punto, texto) => {
        origenRef.current = punto;
        setOrigen(punto);
        setDireccionOrigen(texto || '');
    }, []);
    const fijarDestino = useCallback((punto, texto) => {
        destinoRef.current = punto;
        setDestino(punto);
        setDireccionDestino(texto || '');
    }, []);

    // Notificar al mapa el modo (para que sus toques lleguen aquí) y restaurarlo al cerrar
    useEffect(() => {
        pasoRef.current = paso;
        modeCb.current && modeCb.current(paso);
    }, [paso]);
    useEffect(() => () => { modeCb.current && modeCb.current(0); }, []);

    const obtenerDireccion = async (lat, lng, tipo) => {
        const fijar = tipo === 'origen' ? setDireccionOrigen : setDireccionDestino;
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'User-Agent': 'WhereToSmoke/1.0' } }
            );
            fijar(response.data.display_name.split(',')[0]);
        } catch {
            fijar(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
    };

    const calcular = useCallback(async (o = origenRef.current, d = destinoRef.current) => {
        if (!o || !d) return;
        setCargando(true);
        setError('');
        setPaso(0);
        try {
            const response = await axios.get(`${API_BASE_URL}/rutas/calcular`, {
                params: { origenLat: o.lat, origenLng: o.lng, destinoLat: d.lat, destinoLng: d.lng },
            });
            setRuta(response.data);
            routeCb.current && routeCb.current(response.data);
        } catch (e) {
            console.error('Error calculando ruta:', e);
            setError('No pudimos calcular la ruta. Revisa tu conexión e inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    }, []);

    const usarMiUbicacion = useCallback(() => {
        if (!userLocation) {
            setError('Activa tu ubicación en el mapa para usarla como origen.');
            return false;
        }
        setError('');
        fijarOrigen({ lat: userLocation.lat, lng: userLocation.lng }, 'Mi ubicación');
        return true;
    }, [userLocation, fijarOrigen]);

    // Al abrir: origen = mi ubicación; si llega un spot como destino, calcular de una vez
    useEffect(() => {
        if (rutaInicial && !destinoSpot) {
            const pts = rutaInicial.ruta || [];
            if (pts.length > 1) {
                fijarOrigen({ lat: pts[0].latitud, lng: pts[0].longitud }, 'Punto de salida');
                const fin = pts[pts.length - 1];
                fijarDestino({ lat: fin.latitud, lng: fin.longitud }, 'Destino de la ruta');
            }
            return;
        }
        if (destinoSpot) fijarDestino({ lat: destinoSpot.lat, lng: destinoSpot.lng }, destinoSpot.nombre);
        if (userLocation) {
            fijarOrigen({ lat: userLocation.lat, lng: userLocation.lng }, 'Mi ubicación');
            if (destinoSpot) calcular(origenRef.current, destinoRef.current);
        } else if (destinoSpot) {
            setError('No tenemos tu ubicación. Activa el GPS o elige el origen en el mapa.');
        }
        // Solo al montar
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Toques del mapa mientras se elige origen/destino
    useEffect(() => {
        window.handleRouteMapClick = (latLng) => {
            const p = pasoRef.current;
            if (p === 1) {
                fijarOrigen(latLng, '');
                obtenerDireccion(latLng.lat, latLng.lng, 'origen');
                setPaso(0);
                if (destinoRef.current) calcular(latLng, destinoRef.current);
            } else if (p === 2) {
                fijarDestino(latLng, '');
                obtenerDireccion(latLng.lat, latLng.lng, 'destino');
                setPaso(0);
                if (origenRef.current) calcular(origenRef.current, latLng);
            }
        };
        return () => { delete window.handleRouteMapClick; };
    }, [calcular, fijarOrigen, fijarDestino]);

    const reiniciar = () => {
        fijarDestino(null, '');
        setRuta(null);
        setError('');
        setBusqueda('');
        setPaso(0);
        routeCb.current && routeCb.current(null);
        if (userLocation) fijarOrigen({ lat: userLocation.lat, lng: userLocation.lng }, 'Mi ubicación');
        else fijarOrigen(null, '');
    };

    const elegirSpot = (s) => {
        fijarDestino({ lat: s.lat, lng: s.lng }, s.nombre);
        setBusqueda('');
        if (origenRef.current) calcular(origenRef.current, destinoRef.current);
    };

    const resultados = busqueda.trim().length >= 1
        ? spots.filter((s) => s.nombre && s.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())).slice(0, 4)
        : [];

    const cancelarSeleccion = () => setPaso(0);
    const escape = () => { if (paso > 0) cancelarSeleccion(); else onClose(); };

    const sev = ruta ? severidad(ruta.reportesCercanos ?? 0) : null;
    const eligiendo = paso > 0;
    const compacto = eligiendo || !!ruta || cargando;

    /* ── Fila de origen/destino ── */
    const tramo = (
        <div className="rt-trip" aria-label="Tu trayecto">
            <div className="rt-trip__dots" aria-hidden="true">
                <span className="rt-dot rt-dot--from" />
                <span className="rt-line" />
                <span className="rt-dot rt-dot--to" />
            </div>
            <div className="rt-trip__rows">
                <div className={`rt-point${paso === 1 ? ' is-picking' : ''}`}>
                    <span className="rt-point__label">Origen</span>
                    <span className={`rt-point__value${origen ? '' : ' is-empty'}`}>
                        {paso === 1 ? 'Toca el mapa...' : origen ? (direccionOrigen || 'Punto elegido') : 'Sin definir'}
                    </span>
                </div>
                <div className={`rt-point${paso === 2 ? ' is-picking' : ''}`}>
                    <span className="rt-point__label">Destino</span>
                    <span className={`rt-point__value${destino ? '' : ' is-empty'}`}>
                        {paso === 2 ? 'Toca el mapa...' : destino ? (direccionDestino || 'Punto elegido') : 'Elige un spot o un punto'}
                    </span>
                </div>
            </div>
        </div>
    );

    let cuerpo;
    if (eligiendo) {
        cuerpo = (
            <div className="rt-body">
                <p className="rt-banner" role="status">
                    <HiCursorArrowRays size={18} aria-hidden="true" />
                    {paso === 1 ? 'Toca en el mapa el punto de salida.' : 'Toca en el mapa tu destino.'}
                </p>
                {tramo}
                <div className="rt-actions">
                    {paso === 1 && (
                        <button type="button" className="gm-btn" onClick={() => { if (usarMiUbicacion()) { setPaso(0); if (destinoRef.current) calcular(origenRef.current, destinoRef.current); } }}>
                            <HiViewfinderCircle size={18} aria-hidden="true" /> Usar mi ubicación
                        </button>
                    )}
                    <button type="button" className="gm-btn" onClick={cancelarSeleccion}>Cancelar</button>
                </div>
            </div>
        );
    } else if (cargando) {
        cuerpo = (
            <div className="rt-body" aria-busy="true">
                {tramo}
                <div className="rt-stats" aria-label="Calculando ruta">
                    {[0, 1, 2].map((i) => <div key={i} className="gm-skel rt-skel" />)}
                </div>
                <p className="rt-hint" role="status">Buscando el trayecto más tranquilo...</p>
            </div>
        );
    } else if (ruta) {
        cuerpo = (
            <div className="rt-body">
                {tramo}
                <div className="rt-stats">
                    <div className="rt-stat"><HiMapPin size={20} aria-hidden="true" /><span>Distancia</span><strong>{formatearDistancia(ruta.distanciaMetros)}</strong></div>
                    <div className="rt-stat"><HiClock size={20} aria-hidden="true" /><span>Tiempo</span><strong>{formatearTiempo(ruta.tiempoSegundos)}</strong></div>
                    <div className={`rt-stat rt-stat--${sev.clase}`}><sev.Icono size={20} aria-hidden="true" /><span>Seguridad</span><strong>{sev.texto}</strong></div>
                </div>

                <div className={`rt-safety rt-safety--${sev.clase}`} role="status">
                    <sev.Icono size={20} aria-hidden="true" />
                    <div>
                        <strong>{ruta.reportesCercanos > 0 ? `${ruta.reportesCercanos} reporte${ruta.reportesCercanos > 1 ? 's' : ''} cerca` : sev.detalle}</strong>
                        {ruta.reportesCercanos > 0 && <span>{sev.detalle}</span>}
                    </div>
                </div>

                {ruta.reportesCercanos > 0 && Array.isArray(ruta.reportes) && (
                    <ul className="rt-reports">
                        {ruta.reportes.slice(0, 3).map((r, i) => (
                            <li key={r.id ?? i}>
                                <HiShieldExclamation size={16} aria-hidden="true" />
                                <span>{r.tipo}</span>
                                <time>{new Date(r.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</time>
                            </li>
                        ))}
                        {ruta.reportes.length > 3 && <li className="rt-reports__more">+{ruta.reportes.length - 3} más</li>}
                    </ul>
                )}

                <div className="rt-actions rt-actions--stack">
                    <button type="button" className="gm-btn gm-btn--primary rt-main" onClick={onClose}>
                        <HiMap size={18} aria-hidden="true" /> Ver en el mapa
                    </button>
                    <div className="rt-actions">
                        <button type="button" className="gm-btn" onClick={() => onSimulationStart && onSimulationStart(ruta)}>
                            <HiPlay size={18} aria-hidden="true" /> Simular ruta
                        </button>
                        <button type="button" className="gm-btn" onClick={reiniciar}>
                            <HiTrash size={18} aria-hidden="true" /> Quitar ruta
                        </button>
                    </div>
                </div>
            </div>
        );
    } else {
        cuerpo = (
            <div className="rt-body">
                {tramo}

                <div className="rt-pick">
                    <span className="rt-label">Origen</span>
                    <div className="rt-chips">
                        <button type="button" className={`rt-chip${direccionOrigen === 'Mi ubicación' ? ' is-on' : ''}`} onClick={usarMiUbicacion}>
                            <HiViewfinderCircle size={16} aria-hidden="true" /> Mi ubicación
                        </button>
                        <button type="button" className="rt-chip" onClick={() => { setError(''); setPaso(1); }}>
                            <HiCursorArrowRays size={16} aria-hidden="true" /> Elegir en el mapa
                        </button>
                    </div>
                </div>

                <div className="rt-pick">
                    <span className="rt-label">Destino</span>
                    {spots.length > 0 && (
                        <div className="rt-search">
                            <HiMagnifyingGlass size={18} aria-hidden="true" />
                            <input
                                type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar un spot por nombre" aria-label="Buscar un spot como destino" autoComplete="off"
                            />
                        </div>
                    )}
                    {resultados.length > 0 && (
                        <ul className="rt-results">
                            {resultados.map((s) => (
                                <li key={s.id}>
                                    <button type="button" onClick={() => elegirSpot(s)}>
                                        <HiMapPin size={16} aria-hidden="true" /> <span>{s.nombre}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {busqueda.trim() && resultados.length === 0 && <p className="rt-hint">No encontramos spots con ese nombre.</p>}
                    <div className="rt-chips">
                        <button type="button" className="rt-chip" onClick={() => { setError(''); setPaso(2); }}>
                            <HiCursorArrowRays size={16} aria-hidden="true" /> Elegir en el mapa
                        </button>
                    </div>
                </div>

                <button
                    type="button" className="gm-btn gm-btn--primary gm-btn--block rt-main"
                    disabled={!origen || !destino} onClick={() => calcular()}
                >
                    <HiArrowsRightLeft size={18} aria-hidden="true" /> Calcular ruta
                </button>
                <p className="rt-hint">Buscamos el trayecto que evita las zonas con reportes policiales recientes.</p>
            </div>
        );
    }

    return (
        <BottomSheet
            title="Ruta de bajo perfil"
            subtitle="Evita zonas con reportes policiales"
            icon={HiArrowsRightLeft}
            onClose={onClose}
            onEscape={escape}
            modal={!compacto}
            compact={compacto}
            className="rt-sheet"
        >
            {error && (
                <div className="rt-error" role="alert">
                    <HiExclamationTriangle size={18} aria-hidden="true" />
                    <span>{error}</span>
                    {origen && destino && (
                        <button type="button" className="gm-btn gm-btn--sm" onClick={() => calcular()}>Reintentar</button>
                    )}
                </div>
            )}
            {cuerpo}
        </BottomSheet>
    );
}
