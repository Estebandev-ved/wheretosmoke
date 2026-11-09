import React from 'react';
import { Link } from 'react-router-dom';
import { HiUsers, HiChatBubbleLeftRight } from 'react-icons/hi2';
import useMensajes from '../../hooks/useMensajes';
import './social-usuarios.css';

/** Botones de cabecera "Amigos" y "Mensajes" con badge de pendientes / no leídos. */
const AccesosSociales = () => {
    const { noLeidos, solicitudes } = useMensajes();
    const corto = (n) => (n > 9 ? '9+' : n);
    return (
        <nav className="su-accesos" aria-label="Amigos y mensajes">
            <Link
                to="/amigos" className="su-acceso"
                aria-label={solicitudes > 0 ? `Amigos, ${solicitudes} ${solicitudes === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}` : 'Amigos'}
            >
                <HiUsers size={20} aria-hidden="true" />
                {solicitudes > 0 && <span className="su-badge su-badge--abs" aria-hidden="true">{corto(solicitudes)}</span>}
            </Link>
            <Link
                to="/chat" className="su-acceso"
                aria-label={noLeidos > 0 ? `Mensajes, ${noLeidos} sin leer` : 'Mensajes'}
            >
                <HiChatBubbleLeftRight size={20} aria-hidden="true" />
                {noLeidos > 0 && <span className="su-badge su-badge--abs" aria-hidden="true">{corto(noLeidos)}</span>}
            </Link>
        </nav>
    );
};

export default AccesosSociales;
