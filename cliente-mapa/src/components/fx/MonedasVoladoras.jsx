import React, { useRef } from 'react';
import { popDestino } from './fxApi';

/**
 * Monedas que salen de `vuelo.base`, se esparcen y viajan al chip [data-fx-coins],
 * que hace "pop" en cada llegada. `vuelo` viene de crearVuelo() (fxApi).
 */
const MonedasVoladoras = ({ vuelo, onDone }) => {
    const llegadas = useRef(0);
    const { base, destino, monedas } = vuelo;

    const alLlegar = () => {
        popDestino(destino.el);
        llegadas.current += 1;
        if (llegadas.current >= monedas.length) onDone?.();
    };

    return (
        <div className="fx-monedas" aria-hidden="true">
            {monedas.map((m) => (
                <span
                    key={m.id}
                    className="fx-moneda"
                    style={{
                        left: base.x, top: base.y,
                        '--ox': `${m.ox}px`, '--oy': `${m.oy}px`,
                        '--dx': `${destino.x - base.x}px`, '--dy': `${destino.y - base.y}px`,
                        animationDelay: `${m.delay}ms`, animationDuration: `${m.dur}ms`,
                    }}
                    onAnimationEnd={alLlegar}
                />
            ))}
        </div>
    );
};

export default MonedasVoladoras;
