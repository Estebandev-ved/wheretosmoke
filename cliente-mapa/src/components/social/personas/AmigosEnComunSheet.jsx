import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { HiUsers } from 'react-icons/hi2';
import BottomSheet from '../../BottomSheet';
import AvatarUsuario from '../AvatarUsuario';
import { getAmigosEnComun, mensajeError } from '../../../services/amigosApi';
import './personas.css';

/** Hoja con la lista de amigos en común con una persona. */
const AmigosEnComunSheet = ({ usuarioId, nombre, onClose }) => {
    const [lista, setLista] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let vivo = true;
        getAmigosEnComun(usuarioId)
            .then((d) => { if (vivo) setLista(Array.isArray(d) ? d : []); })
            .catch((e) => { if (vivo) setError(mensajeError(e, 'No pudimos cargar la lista.')); });
        return () => { vivo = false; };
    }, [usuarioId]);

    let cuerpo;
    if (error) cuerpo = <p className="pe-nota" role="alert">{error}</p>;
    else if (!lista) cuerpo = <div className="gm-skel" style={{ height: 120 }} aria-busy="true" aria-label="Cargando" />;
    else if (lista.length === 0) cuerpo = <p className="pe-nota">Aún no tienen amigos en común.</p>;
    else {
        cuerpo = (
            <ul className="am-lista">
                {lista.map((u) => (
                    <li key={u.id}>
                        <Link to={`/usuario/${u.id}`} className="gm-card am-fila" onClick={onClose} aria-label={`Ver perfil de ${u.username}`}>
                            <AvatarUsuario usuario={u} size={42} />
                            <span className="am-info"><strong>{u.username}</strong><small>Nv. {u.nivel ?? 1}</small></span>
                        </Link>
                    </li>
                ))}
            </ul>
        );
    }

    return createPortal(
        <BottomSheet title="Amigos en común" subtitle={nombre ? `Tú y ${nombre}` : undefined} icon={HiUsers} onClose={onClose} className="pe-sheet">
            <div className="pe-sheet__body" aria-live="polite">{cuerpo}</div>
        </BottomSheet>,
        document.body
    );
};

export default AmigosEnComunSheet;
