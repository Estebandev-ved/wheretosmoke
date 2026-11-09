import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGamificacion } from '../../hooks/useGamificacion';
import { useGlobalSound } from '../../context/SoundContext';
import { vibrar } from '../../hooks/useHaptics';
import { suscribir } from '../../utils/eventosJuego';
import { resolveItemImage } from '../../utils/itemImage';
import { FRASES, FRASES_DORMIDA, FRASES_TRISTE, TIPS, REACCIONES } from '../../utils/frasesPaisas';
import './fx.css';

const horaBogota = () => {
    try {
        const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', hour: 'numeric', hour12: false }).format(new Date()), 10);
        return h % 24;
    } catch {
        return new Date().getHours();
    }
};
const esNoche = () => { const h = horaBogota(); return h >= 22 || h < 5; };
const azar = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Mascota flotante del mapa. Estados: idle (respira), dormida (22-5 h Bogotá),
 * triste (racha en 0 sin check-in hoy) y salto (al ganar premios / subir de nivel).
 * Al tocarla dice una frase paisa y da un tip de la app.
 */
const MascotaCompanera = () => {
    const g = useGamificacion();
    const { sounds } = useGlobalSound();
    const [noche, setNoche] = useState(esNoche);
    const [salto, setSalto] = useState(false);
    const [burbuja, setBurbuja] = useState(null);
    const tTip = useRef(0);
    const tSalto = useRef(null);
    const tBurbuja = useRef(null);

    useEffect(() => {
        const id = setInterval(() => setNoche(esNoche()), 60000);
        return () => clearInterval(id);
    }, []);

    const decir = useCallback((texto, tip, ms = 5000) => {
        setBurbuja({ texto, tip });
        clearTimeout(tBurbuja.current);
        tBurbuja.current = setTimeout(() => setBurbuja(null), ms);
    }, []);

    useEffect(() => {
        const quitar = suscribir('*', (tipo, datos) => {
            if (!REACCIONES[tipo]) return;
            setSalto(true);
            clearTimeout(tSalto.current);
            tSalto.current = setTimeout(() => setSalto(false), 1400);
            decir(REACCIONES[tipo](datos), null, 3800);
        });
        return () => { quitar(); clearTimeout(tSalto.current); clearTimeout(tBurbuja.current); };
    }, [decir]);

    const triste = !g.esInvitado && g.rachaDias === 0 && !g.checkinHoy;
    const estado = salto ? 'salto' : triste ? 'triste' : noche ? 'dormida' : 'idle';

    const tocar = () => {
        sounds.pop();
        vibrar('tap');
        if (burbuja) { setBurbuja(null); clearTimeout(tBurbuja.current); return; }
        const tip = TIPS[tTip.current++ % TIPS.length];
        const frase = estado === 'dormida' ? azar(FRASES_DORMIDA) : estado === 'triste' ? azar(FRASES_TRISTE) : azar(FRASES);
        decir(frase, tip);
    };

    const mascota = g.equipadosItems?.MASCOTA;
    const src = mascota ? resolveItemImage(mascota.imagen) : '/icons/bud_smoking.png';

    return (
        <div className={`fx-mascota fx-mascota--${estado}`}>
            {burbuja && (
                <div className="fx-mascota__burbuja" role="status" aria-live="polite">
                    <strong>{burbuja.texto}</strong>
                    {burbuja.tip && <span>{burbuja.tip}</span>}
                </div>
            )}
            <button
                type="button"
                className="fx-mascota__btn"
                onClick={tocar}
                aria-label={`${mascota ? mascota.nombre : 'Tu mascota'}${estado === 'dormida' ? ', dormida' : estado === 'triste' ? ', triste' : ''}. Tócala para un tip`}
            >
                <img src={src} alt="" draggable="false" />
                {estado === 'dormida' && <span className="fx-mascota__zzz" aria-hidden="true">z<i>z</i><b>z</b></span>}
                {estado === 'triste' && <span className="fx-mascota__gota" aria-hidden="true" />}
            </button>
        </div>
    );
};

export default MascotaCompanera;
