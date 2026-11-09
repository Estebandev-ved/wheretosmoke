import React from 'react';
import { HiXMark, HiStar, HiArrowTopRightOnSquare, HiArrowsRightLeft, HiChatBubbleLeftRight, HiPhoto } from 'react-icons/hi2';
import VoteButtons from './VoteButtons';
import './social.css';
import './map-hud.css';

const CATEGORIAS = {
    PARQUE: 'Parque público',
    MIRADOR: 'Mirador',
    ROOF: 'Roof / Terraza',
    NATURALEZA: 'Naturaleza',
    INDOOR: 'Indoor',
    CALLEJON: 'Callejón',
    OTRO: 'Otro',
};

const formatDistancia = (m) => {
    if (m == null || Number.isNaN(m)) return null;
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
};

/**
 * Tarjeta flotante del spot seleccionado (reemplaza al Popup de Leaflet).
 * Solo muestra datos reales del SpotDTO que ya devuelve el backend.
 */
const SpotCard = ({ spotDTO, distanciaM, onClose, onVote, onDetail, onChat, onRoute }) => {
    if (!spotDTO) return null;
    const spot = spotDTO.spot;
    const esRojo = spot.estado === 'ROJO';
    const distancia = formatDistancia(distanciaM);
    const rating = typeof spot.calificacionPromedio === 'number' && spot.calificacionPromedio > 0
        ? spot.calificacionPromedio.toFixed(1) : null;
    const categoria = CATEGORIAS[spot.categoria] || spot.categoria;

    const comoLlegar = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitud},${spot.longitud}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <aside className="spot-card" aria-label={`Detalle de ${spot.nombre}`}>
            <div className="spot-card__grab" aria-hidden="true" />
            <button type="button" className="spot-card__close" onClick={onClose} aria-label="Cerrar tarjeta del spot">
                <HiXMark size={20} aria-hidden="true" />
            </button>

            <div className="spot-card__head">
                <span className={`spot-card__state ${esRojo ? 'is-danger' : 'is-ok'}`}>
                    {esRojo ? 'Alerta tombo' : 'Zona relax'}
                </span>
                {categoria && <span className="spot-card__tag">{categoria}</span>}
            </div>

            <h3 className="spot-card__title">{spot.nombre}</h3>

            {(spot.comuna || spot.descubridorNombre) && (
                <div className="spot-card__social">
                    {spot.comuna && <span className="spot-card__comuna">{spot.comuna}</span>}
                    {spot.descubridorNombre && <span className="spot-card__desc">🏆 Descubierto por @{spot.descubridorNombre}</span>}
                </div>
            )}

            <div className="spot-card__meta">
                {rating && (
                    <span className="spot-card__rating"><HiStar size={15} aria-hidden="true" /> {rating}</span>
                )}
                {distancia && <span>{distancia}</span>}
                {spotDTO.mensajeEstado && <span className="spot-card__msg">{spotDTO.mensajeEstado}</span>}
            </div>

            <VoteButtons
                onTomboClick={() => onVote(spot.id, 'tombo')}
                onRelaxClick={() => onVote(spot.id, 'relax')}
                disabled={spotDTO.usuarioYaVoto}
                votosTombo={spotDTO.votosTombo}
                votosRelax={spotDTO.votosRelax}
                size="small"
            />

            <div className="spot-card__actions">
                <button type="button" className="spot-card__btn spot-card__btn--primary" onClick={onRoute} aria-label="Ruta segura hasta este spot">
                    <HiArrowsRightLeft size={17} aria-hidden="true" /> Ruta segura
                </button>
                <button type="button" className="spot-card__btn" onClick={comoLlegar} aria-label="Abrir en Google Maps">
                    <HiArrowTopRightOnSquare size={17} aria-hidden="true" /> Google Maps
                </button>
                <button type="button" className="spot-card__btn" onClick={onDetail} aria-label="Ver fotos y comentarios">
                    <HiPhoto size={17} aria-hidden="true" /> Ver detalle
                </button>
                <button type="button" className="spot-card__btn" onClick={onChat} aria-label="Chatear en este spot">
                    <HiChatBubbleLeftRight size={17} aria-hidden="true" /> Chat
                </button>
            </div>
        </aside>
    );
};

export default SpotCard;
