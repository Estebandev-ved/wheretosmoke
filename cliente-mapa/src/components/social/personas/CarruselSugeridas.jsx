import React, { useMemo, useState } from 'react';
import { HiArrowPath } from 'react-icons/hi2';
import TarjetaPersona from './TarjetaPersona';
import AmigosEnComunSheet from './AmigosEnComunSheet';
import usePersonas, { guardarDescartada, leerDescartadas } from './usePersonas';
import './personas.css';

const OCULTAR = ['AMIGOS', 'BLOQUEADO', 'YO'];

/**
 * "Gente que quizás conozcas": carrusel horizontal reutilizable.
 * Si no hay nada que sugerir (o el backend no lo tiene) no pinta nada, salvo `mostrarVacio`.
 */
const CarruselSugeridas = ({ titulo = 'Gente que quizás conozcas', compacta = false, limite = 10, mostrarVacio = false, activo = true }) => {
    const { items, cargando, error, reintentar, actualizar, quitar } = usePersonas('sugeridas', {}, { limite, activo });
    const [descartadas, setDescartadas] = useState(leerDescartadas);
    const [comun, setComun] = useState(null);

    const visibles = useMemo(
        () => items.filter((u) => !descartadas.includes(u.id) && !OCULTAR.includes(u.estadoAmistad)),
        [items, descartadas]
    );
    const descartar = (u) => { guardarDescartada(u.id); setDescartadas((d) => [u.id, ...d]); quitar(u.id); };

    if (!cargando && !error && visibles.length === 0 && !mostrarVacio) return null;

    let cuerpo;
    if (cargando) {
        cuerpo = (
            <div className="pe-carrusel" aria-busy="true" aria-label="Cargando sugerencias">
                {[0, 1, 2].map((i) => <div key={i} className={`gm-skel pe-card pe-card--skel${compacta ? ' pe-card--compacta' : ''}`} />)}
            </div>
        );
    } else if (error) {
        cuerpo = (
            <div className="gm-card pe-inline" role="alert">
                <span>{error}</span>
                <button type="button" className="gm-btn gm-btn--sm" onClick={reintentar}><HiArrowPath size={14} aria-hidden="true" /> Reintentar</button>
            </div>
        );
    } else if (visibles.length === 0) {
        cuerpo = (
            <div className="gm-card gm-state">
                <img src="/icons/bud_map.png" alt="" width="72" height="72" />
                <p>Por ahora no tenemos sugerencias. Vuelve más tarde.</p>
            </div>
        );
    } else {
        cuerpo = (
            <ul className="pe-carrusel" aria-label={`${titulo}, desliza para ver más`}>
                {visibles.map((u) => (
                    <li key={u.id}>
                        <TarjetaPersona
                            usuario={u} compacta={compacta}
                            onCambio={(p) => actualizar(u.id, p)} onDescartar={descartar} onComun={setComun}
                        />
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <section className="pe-seccion" aria-label={titulo}>
            <div className="gm-section-title"><h2>{titulo}</h2></div>
            {cuerpo}
            {comun && <AmigosEnComunSheet usuarioId={comun.id} nombre={comun.username} onClose={() => setComun(null)} />}
        </section>
    );
};

export default CarruselSugeridas;
