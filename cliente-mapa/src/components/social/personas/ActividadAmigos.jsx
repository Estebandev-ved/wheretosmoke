import React, { lazy, Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { HiMapPin, HiFlag, HiPhoto } from 'react-icons/hi2';
import { API_BASE } from '../../../config';
import AvatarUsuario from '../AvatarUsuario';
import { getActividadAmigos } from '../../../services/amigosApi';
import { tiempoCorto } from '../../../utils/social';
import './personas.css';

const SpotDetailModal = lazy(() => import('../../SpotDetailModal'));
const ICONOS = { SPOT_DESCUBIERTO: HiMapPin, SELLO_COMUNA: HiFlag, FOTO: HiPhoto };

/** "Actividad de tus amigos": tarjetas compactas que llevan al perfil o abren el spot. No pinta nada si no hay actividad. */
const ActividadAmigos = ({ darkMode = true }) => {
    const [lista, setLista] = useState(null);
    const [spot, setSpot] = useState(null);

    useEffect(() => {
        let vivo = true;
        getActividadAmigos(8)
            .then((d) => { if (vivo) setLista(Array.isArray(d) ? d : []); })
            .catch(() => { if (vivo) setLista([]); });
        return () => { vivo = false; };
    }, []);

    const abrirSpot = async (id) => {
        try {
            const { data } = await axios.get(`${API_BASE}/spots`);
            const s = Array.isArray(data) ? data.find((x) => x.id === id) : null;
            if (s) setSpot(s);
        } catch { /* sin spot: la tarjeta sigue llevando al perfil por su otro enlace */ }
    };

    if (!lista) return <div className="pe-seccion" aria-busy="true" aria-label="Cargando actividad"><div className="gm-skel" style={{ height: 76 }} /></div>;
    if (lista.length === 0) return null;

    return (
        <section className="pe-seccion" aria-label="Actividad de tus amigos">
            <div className="gm-section-title"><h2>Actividad de tus amigos</h2></div>
            <ul className="pe-actividad">
                {lista.map((a, i) => {
                    const Icono = ICONOS[a.tipo] || HiMapPin;
                    const u = a.usuario || {};
                    return (
                        <li key={`${u.id}-${a.fecha}-${i}`} className="gm-card pe-act">
                            <Link to={`/usuario/${u.id}`} className="pe-act__av" aria-label={`Ver perfil de ${u.username}`}>
                                <AvatarUsuario usuario={u} size={38} />
                            </Link>
                            <div className="pe-act__txt">
                                <strong>{u.username}</strong>
                                <span>{a.texto}</span>
                                <small><Icono size={12} aria-hidden="true" /> {tiempoCorto(a.fecha)}</small>
                            </div>
                            {a.spotId != null && (
                                <button type="button" className="gm-btn gm-btn--sm" onClick={() => abrirSpot(a.spotId)} aria-label={`Ver el spot de ${u.username}`}>Ver spot</button>
                            )}
                        </li>
                    );
                })}
            </ul>
            {spot && createPortal(
                <Suspense fallback={null}><SpotDetailModal spot={spot} darkMode={darkMode} onClose={() => setSpot(null)} /></Suspense>,
                document.body
            )}
        </section>
    );
};

export default ActividadAmigos;
