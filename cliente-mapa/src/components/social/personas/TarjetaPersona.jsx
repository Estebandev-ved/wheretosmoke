import React from 'react';
import { Link } from 'react-router-dom';
import { HiXMark, HiUsers } from 'react-icons/hi2';
import AvatarUsuario from '../AvatarUsuario';
import BotonAmistadRapido from '../BotonAmistadRapido';
import './personas.css';

/** Tarjeta de persona para carruseles (sugeridas). `compacta` para Amigos y perfil. */
const TarjetaPersona = ({ usuario: u, onCambio, onDescartar, onComun, compacta = false }) => (
    <article className={`gm-card pe-card${compacta ? ' pe-card--compacta' : ''}`} aria-label={`Sugerencia: ${u.username}`}>
        {onDescartar && (
            <button type="button" className="pe-x" onClick={() => onDescartar(u)} aria-label={`Descartar a ${u.username}`}>
                <HiXMark size={16} aria-hidden="true" />
            </button>
        )}
        <Link to={`/usuario/${u.id}`} className="pe-card__perfil" aria-label={`Ver perfil de ${u.username}`}>
            <AvatarUsuario usuario={u} size={compacta ? 64 : 84} />
            <strong className="pe-nombre">{u.username}</strong>
            <small className="pe-rango">{u.tituloRango || 'Novato'} · Nv. {u.nivel ?? 1}</small>
        </Link>
        {!compacta && Array.isArray(u.razones) && u.razones.length > 0 && (
            <ul className="pe-razones" aria-label="Por qué te lo sugerimos">
                {u.razones.slice(0, 2).map((r) => <li key={r} className="gm-chip">{r}</li>)}
            </ul>
        )}
        {(u.amigosEnComun ?? 0) > 0 ? (
            <button type="button" className="pe-comun" onClick={() => onComun?.(u)} aria-label={`${u.amigosEnComun} amigos en común con ${u.username}. Ver lista`}>
                <HiUsers size={14} aria-hidden="true" /> {u.amigosEnComun} {u.amigosEnComun === 1 ? 'amigo' : 'amigos'} en común
            </button>
        ) : <span className="pe-comun pe-comun--vacio" aria-hidden="true" />}
        <div className="pe-card__acc">
            <BotonAmistadRapido usuario={u} onCambio={onCambio} etiqueta="Conectar" />
        </div>
    </article>
);

export default TarjetaPersona;
