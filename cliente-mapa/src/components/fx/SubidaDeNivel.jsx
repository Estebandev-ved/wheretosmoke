import React, { useEffect, useRef } from 'react';
import Confeti from './Confeti';
import { useGlobalSound } from '../../context/SoundContext';
import { vibrar } from '../../hooks/useHaptics';
import { resolveItemImage } from '../../utils/itemImage';
import './fx.css';

/**
 * Modal a pantalla completa de subida de nivel: mascota festejando, nivel, rango y confeti.
 * Props: nivel, titulo (rango), imagen (mascota equipada o undefined), onClose().
 */
const SubidaDeNivel = ({ nivel, titulo, imagen, onClose }) => {
    const { sounds } = useGlobalSound();
    const boton = useRef(null);

    useEffect(() => {
        sounds.levelUp();
        vibrar('nivel');
        boton.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
        // Solo al abrir
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fx-nivel" role="dialog" aria-modal="true" aria-labelledby="fx-nivel-titulo" onClick={onClose}>
            <Confeti intensidad={200} origen={{ x: window.innerWidth / 2, y: window.innerHeight * 0.4 }} />
            <div className="fx-nivel__card" onClick={(e) => e.stopPropagation()}>
                <div className="fx-nivel__rayos" aria-hidden="true" />
                <img className="fx-nivel__mascota" src={imagen ? resolveItemImage(imagen) : '/icons/bud_smoking.png'} alt="" />
                <span className="fx-nivel__kicker">¡Subiste de nivel!</span>
                <h2 id="fx-nivel-titulo" className="fx-nivel__num">Nivel {nivel}</h2>
                {titulo && <span className="gm-chip gm-chip--accent">{titulo}</span>}
                <p>Sigue ayudando a la comunidad para desbloquear más artículos en la tienda.</p>
                <button ref={boton} type="button" className="gm-btn gm-btn--primary" onClick={onClose}>Seguir jugando</button>
            </div>
        </div>
    );
};

export default SubidaDeNivel;
