import React from 'react';
import { HiArrowPath } from 'react-icons/hi2';

/** Indicador del pull-to-refresh (usar con usePullToRefresh). */
const IndicadorPull = ({ pull, refrescando, umbral = 64 }) => {
    if (pull <= 0 && !refrescando) return null;
    const listo = pull >= umbral;
    return (
        <div
            className={`fx-ptr${refrescando ? ' is-loading' : ''}${listo ? ' is-ready' : ''}`}
            style={{ transform: `translate(-50%, ${Math.min(pull, 80) - 8}px)` }}
            role="status"
            aria-live="polite"
        >
            <HiArrowPath size={18} aria-hidden="true" style={{ transform: refrescando ? undefined : `rotate(${pull * 4}deg)` }} />
            <span className="gm-sr">{refrescando ? 'Actualizando' : listo ? 'Suelta para actualizar' : 'Desliza para actualizar'}</span>
        </div>
    );
};

export default IndicadorPull;
