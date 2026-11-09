import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Enlace al perfil público de una persona. Si el dato no trae id, se muestra el
 * contenido sin enlace (no se inventan ids).
 */
const UsuarioLink = ({ id, username, className = '', children, ...resto }) => {
    const contenido = children ?? username;
    if (id == null) return <span className={className} {...resto}>{contenido}</span>;
    return (
        <Link
            to={`/usuario/${id}`}
            className={`su-link ${className}`.trim()}
            aria-label={username ? `Ver perfil de ${username}` : undefined}
            onClick={(e) => e.stopPropagation()}
            {...resto}
        >
            {contenido}
        </Link>
    );
};

export default UsuarioLink;
