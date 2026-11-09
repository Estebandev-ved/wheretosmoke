import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowPath, HiUsers } from 'react-icons/hi2';
import AvatarUsuario from '../AvatarUsuario';
import BotonAmistadRapido from '../BotonAmistadRapido';
import AmigosEnComunSheet from './AmigosEnComunSheet';
import usePersonas from './usePersonas';
import './personas.css';

/** Lista vertical con scroll infinito (IntersectionObserver) de "Descubrir personas". */
const ListaPersonas = ({ params, activo = true }) => {
    const { items, cargando, masCargando, error, hayMas, cargarMas, reintentar, actualizar } = usePersonas('descubrir', params, { limite: 12, activo });
    const [comun, setComun] = useState(null);
    const centinela = useRef(null);

    useEffect(() => {
        const el = centinela.current;
        if (!el || !hayMas || typeof IntersectionObserver === 'undefined') return undefined;
        const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) cargarMas(); }, { rootMargin: '240px' });
        io.observe(el);
        return () => io.disconnect();
    }, [hayMas, cargarMas, items.length]);

    if (cargando) {
        return <div className="ex-loading" aria-busy="true" aria-label="Cargando personas">{[0, 1, 2, 3].map((i) => <div key={i} className="gm-skel ex-skel-row" />)}</div>;
    }
    if (error && items.length === 0) {
        return (
            <div className="gm-card gm-state" role="alert">
                <img src="/icons/bud_angry.png" alt="" width="88" height="88" />
                <h2>No pudimos cargar</h2><p>{error}</p>
                <button type="button" className="gm-btn gm-btn--primary" onClick={reintentar}><HiArrowPath size={16} aria-hidden="true" /> Reintentar</button>
            </div>
        );
    }
    if (items.length === 0) {
        return (
            <div className="gm-card gm-state">
                <img src="/icons/bud_map.png" alt="" width="88" height="88" />
                <h2>Sin resultados</h2><p>No encontramos a nadie con esos filtros. Prueba con otro nombre o comuna.</p>
            </div>
        );
    }
    return (
        <>
            <ul className="am-lista" aria-label="Personas">
                {items.map((u) => (
                    <li key={u.id} className="gm-card am-fila">
                        <Link to={`/usuario/${u.id}`} className="am-fila__main" aria-label={`Ver perfil de ${u.username}`}>
                            <AvatarUsuario usuario={u} size={46} />
                            <span className="am-info">
                                <strong>{u.username}</strong>
                                <small>Nv. {u.nivel ?? 1} · {u.tituloRango || 'Novato'}</small>
                            </span>
                        </Link>
                        {(u.amigosEnComun ?? 0) > 0 && (
                            <button type="button" className="pe-comun pe-comun--fila" onClick={() => setComun(u)} aria-label={`${u.amigosEnComun} amigos en común con ${u.username}. Ver lista`}>
                                <HiUsers size={14} aria-hidden="true" /> {u.amigosEnComun}
                            </button>
                        )}
                        <BotonAmistadRapido usuario={u} onCambio={(p) => actualizar(u.id, p)} etiqueta="Conectar" />
                    </li>
                ))}
            </ul>
            <div ref={centinela} className="pe-centinela" aria-hidden="true" />
            {masCargando && <div className="gm-skel ex-skel-row" aria-busy="true" />}
            {error && <button type="button" className="gm-btn gm-btn--block" onClick={cargarMas}><HiArrowPath size={14} aria-hidden="true" /> Reintentar cargar más</button>}
            {hayMas && !masCargando && !error && <button type="button" className="gm-btn gm-btn--block" onClick={cargarMas}>Ver más personas</button>}
            {comun && <AmigosEnComunSheet usuarioId={comun.id} nombre={comun.username} onClose={() => setComun(null)} />}
        </>
    );
};

export default ListaPersonas;
