import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { HiArrowPath, HiMapPin, HiCheckCircle } from 'react-icons/hi2';
import { useGamificacion } from '../hooks/useGamificacion';
import { mensajeError } from '../services/gamificacionApi';
import { resolveItemImage } from '../utils/itemImage';
import BottomSheet from './BottomSheet';
import EstadoVacio from './fx/EstadoVacio';
import './gamificacion.css';
import './cofre-album.css';

const MIN_SPOTS = 3; // con menos spots la comuna no se puede completar
const R = 30;
const CIRC = 2 * Math.PI * R;

/** Sello de una comuna: anillo de progreso + mascota (dorado si está completa). */
const Sello = ({ c, mascota, grande = false }) => {
    const pocos = c.totalSpots < MIN_SPOTS;
    const pct = pocos ? 0 : Math.min(1, c.visitados / Math.max(1, c.totalSpots));
    const estado = c.completa ? 'completa' : pocos ? 'pocos' : 'pendiente';
    return (
        <span className={`al-sello is-${estado}${grande ? ' is-grande' : ''}`} aria-hidden="true">
            <svg viewBox="0 0 72 72" className="al-anillo">
                <circle cx="36" cy="36" r={R} className="al-anillo-fondo" />
                {!pocos && (
                    <circle cx="36" cy="36" r={R} className="al-anillo-prog" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} transform="rotate(-90 36 36)" />
                )}
            </svg>
            {c.completa ? (
                <img src={resolveItemImage(mascota)} alt="" draggable="false" />
            ) : (
                <span className="al-prog">{pocos ? '·' : `${c.visitados}/${c.totalSpots}`}</span>
            )}
        </span>
    );
};

const textoEstado = (c) => {
    if (c.completa) return 'Completa';
    if (c.totalSpots < MIN_SPOTS) return 'Pocos spots aún';
    return `${c.visitados}/${c.totalSpots} spots`;
};

/** Álbum de comunas: cuadrícula de sellos, resumen y detalle en hoja inferior. */
const AlbumComunas = ({ version = 0 }) => {
    const navigate = useNavigate();
    const g = useGamificacion();
    const { getAlbum } = g;
    const [album, setAlbum] = useState(null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [sel, setSel] = useState(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const d = await getAlbum();
            setAlbum(Array.isArray(d) ? d : []);
        } catch (e) {
            setError(mensajeError(e, 'No pudimos cargar tu álbum.'));
        } finally {
            setCargando(false);
        }
    }, [getAlbum]);

    useEffect(() => {
        const id = setTimeout(cargar, 0);
        return () => clearTimeout(id);
    }, [cargar, version]);

    const mascota = g.equipadosItems?.MASCOTA?.imagen || '/icons/bud_smoking.png';
    const total = album?.length || 0;
    const completas = useMemo(() => (album || []).filter((c) => c.completa).length, [album]);
    const actual = sel && album ? album.find((c) => c.comuna === sel) : null;

    return (
        <section aria-label="Álbum de comunas">
            <div className="gm-section-title">
                <h2>Álbum de comunas</h2>
                {album && total > 0 && <small>{completas} de {total} comunas</small>}
            </div>

            {cargando && !album ? (
                <div className="gm-skel" style={{ height: 220 }} aria-busy="true" aria-label="Cargando álbum" />
            ) : error && !album ? (
                <div className="gm-card gm-state" role="alert">
                    <img src="/icons/bud_angry.png" alt="" />
                    <p>{error}</p>
                    <button type="button" className="gm-btn gm-btn--primary gm-btn--sm" onClick={cargar}><HiArrowPath size={16} aria-hidden="true" /> Reintentar</button>
                </div>
            ) : !album || album.length === 0 ? (
                <EstadoVacio texto="Tu álbum aún no tiene comunas. Visita, califica o comenta spots para empezar a coleccionar sellos." />
            ) : (
                <div className="gm-card al-card">
                    <div className="al-resumen">
                        <div className="gm-bar gm-bar--gold" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completas} aria-label="Comunas completadas">
                            <span style={{ width: `${(completas / total) * 100}%` }} />
                        </div>
                        <small>Completa una comuna y gana +50 monedas.</small>
                    </div>
                    <ul className="al-grid">
                        {album.map((c) => (
                            <li key={c.comuna}>
                                <button
                                    type="button"
                                    className={`al-item${c.completa ? ' is-completa' : ''}${c.totalSpots < MIN_SPOTS ? ' is-pocos' : ''}`}
                                    onClick={() => setSel(c.comuna)}
                                    aria-label={`${c.comuna}: ${c.completa ? 'completa' : c.totalSpots < MIN_SPOTS ? 'pocos spots aún' : `${c.visitados} de ${c.totalSpots} spots`}`}
                                >
                                    <Sello c={c} mascota={mascota} />
                                    <span className="al-nombre">{c.comuna}</span>
                                    <small className="al-estado">{textoEstado(c)}</small>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {actual && createPortal(
                <BottomSheet title={actual.comuna} subtitle={textoEstado(actual)} icon={HiMapPin} onClose={() => setSel(null)} className="al-sheet">
                    <div className="al-detalle">
                        <Sello c={actual} mascota={mascota} grande />
                        {actual.completa ? (
                            <>
                                <p className="al-detalle-titulo"><HiCheckCircle size={18} aria-hidden="true" /> ¡Comuna completada!</p>
                                <p>Visitaste {actual.visitados} de {actual.totalSpots} spots y ganaste +50 monedas por este sello.</p>
                            </>
                        ) : actual.totalSpots < MIN_SPOTS ? (
                            <>
                                <p className="al-detalle-titulo">Pocos spots aún</p>
                                <p>Esta comuna tiene {actual.totalSpots} {actual.totalSpots === 1 ? 'spot' : 'spots'}. Hacen falta al menos {MIN_SPOTS} para poder completarla. Ayuda a la comunidad agregando uno.</p>
                            </>
                        ) : (
                            <>
                                <p className="al-detalle-titulo">{actual.visitados} de {actual.totalSpots} spots visitados</p>
                                <div className="gm-bar gm-bar--gold al-detalle-barra" role="progressbar" aria-valuemin={0} aria-valuemax={actual.totalSpots} aria-valuenow={actual.visitados} aria-label={`Progreso en ${actual.comuna}`}>
                                    <span style={{ width: `${(actual.visitados / actual.totalSpots) * 100}%` }} />
                                </div>
                                <p>Visita, califica o comenta spots de esta comuna. Te {actual.totalSpots - actual.visitados === 1 ? 'falta 1' : `faltan ${actual.totalSpots - actual.visitados}`} para el sello dorado y +50 monedas.</p>
                            </>
                        )}
                        <button type="button" className="gm-btn gm-btn--primary gm-btn--block" onClick={() => { setSel(null); navigate('/explorar?tab=spots'); }}>
                            Explorar spots
                        </button>
                    </div>
                </BottomSheet>,
                document.body
            )}
        </section>
    );
};

export default AlbumComunas;
