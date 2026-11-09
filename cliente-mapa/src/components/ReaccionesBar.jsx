import React, { useRef, useState } from 'react';
import { EMOJIS_REACCION, NOMBRES_REACCION } from '../services/socialApi';
import './social.css';

/**
 * Barra de reacciones tipo chat. Controlada: el padre guarda `reacciones` y `miReaccion`
 * y resuelve la actualización optimista en `onReaccionar(emoji)`.
 */
const ReaccionesBar = ({ reacciones = {}, miReaccion = null, onReaccionar }) => {
    const [flotantes, setFlotantes] = useState([]);
    const [pop, setPop] = useState(null);
    const idRef = useRef(0);

    const pulsar = (emoji) => {
        if (miReaccion !== emoji) {
            const id = ++idRef.current;
            setFlotantes((f) => [...f, { id, emoji }]);
            setTimeout(() => setFlotantes((f) => f.filter((x) => x.id !== id)), 900);
            setPop(emoji);
            setTimeout(() => setPop((p) => (p === emoji ? null : p)), 380);
        }
        onReaccionar(emoji);
    };

    return (
        <div className="rx-bar" role="group" aria-label="Reacciones">
            {EMOJIS_REACCION.map((emoji) => {
                const n = reacciones[emoji] || 0;
                const activo = miReaccion === emoji;
                return (
                    <button
                        key={emoji}
                        type="button"
                        className={`rx-btn${activo ? ' is-mine' : ''}${pop === emoji ? ' is-pop' : ''}`}
                        aria-pressed={activo}
                        aria-label={`${NOMBRES_REACCION[emoji]}, ${n} ${n === 1 ? 'reacción' : 'reacciones'}`}
                        onClick={() => pulsar(emoji)}
                    >
                        <span className="rx-emoji" aria-hidden="true">{emoji}</span>
                        {n > 0 && <span className="rx-count">{n}</span>}
                    </button>
                );
            })}
            <span className="rx-float-layer" aria-hidden="true">
                {flotantes.map((f) => <span key={f.id} className="rx-float">{f.emoji}</span>)}
            </span>
        </div>
    );
};

export default ReaccionesBar;
