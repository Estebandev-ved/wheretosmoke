import React from 'react';
import { HiFire } from 'react-icons/hi2';

/** Nivel de la llama según días de racha: 0 apagada, 1 (1-2), 2 (3-6), 3 (7-13), 4 (14-29), 5 (30+). */
const nivelLlama = (dias) => (dias >= 30 ? 5 : dias >= 14 ? 4 : dias >= 7 ? 3 : dias >= 3 ? 2 : dias >= 1 ? 1 : 0);

/** Llama que crece y cambia de color con la racha. Decorativa (aria-hidden). */
const LlamaRacha = ({ dias = 0, size = 16 }) => {
    const n = nivelLlama(dias);
    return (
        <span className={`fx-llama fx-llama--${n}`} aria-hidden="true">
            <HiFire size={Math.round(size * (1 + n * 0.1))} />
        </span>
    );
};

export default LlamaRacha;
