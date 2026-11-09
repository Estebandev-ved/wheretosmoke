import React, { useEffect } from 'react';
import { useGamificacion } from '../hooks/useGamificacion';
import { useSegundosHasta, formatoReloj } from '../hooks/useEventoHoraFeliz';
import { suscribir } from '../utils/eventosJuego';
import { lanzarConfeti, COLORES_RAREZA } from './fx/fxApi';
import { useToast } from './WeedToast';
import './hora-feliz.css';

let ultimoAviso = 0; // evita avisar dos veces si hay dos montajes

/**
 * Píldora compacta de la hora feliz para el HUD del mapa.
 * Fuera de ventana: "Hora feliz en 03:12:45" (discreta). Dentro: "x2 XP y monedas · quedan 12:30" (dorada, pulso).
 * Si el backend no responde (evento null) no renderiza nada.
 */
export const PildoraHoraFeliz = () => {
    const { evento } = useGamificacion();
    const activo = !!evento?.activo;
    const seg = useSegundosHasta(evento ? (activo ? evento.finMs : evento.proximaMs) : null);
    if (!evento || seg == null) return null;

    return (
        <div
            className={`hf-pill${activo ? ' is-activa' : ''}`}
            role="group"
            aria-label={activo ? `Hora feliz activa: doble XP y monedas` : 'Próxima hora feliz'}
        >
            {activo ? (
                <>
                    <b className="hf-x2" aria-hidden="true">x{evento.multiplicador}</b>
                    <span className="hf-pill__txt">XP y monedas<span className="hf-pill__sep" aria-hidden="true"> · </span><span className="hf-pill__lbl">quedan </span></span>
                </>
            ) : (
                <span className="hf-pill__txt"><span aria-hidden="true">🌿 </span>Hora feliz en </span>
            )}
            <time className="hf-pill__time" role="timer" aria-label={`${activo ? 'Quedan' : 'Faltan'} ${formatoReloj(seg)}`}>{formatoReloj(seg)}</time>
        </div>
    );
};

/** Insignia "x2" que solo se ve durante la ventana (Misiones, check-in, chips de monedas). */
export const InsigniaX2 = ({ className = '' }) => {
    const { multiplicadorEvento } = useGamificacion();
    if (multiplicadorEvento <= 1) return null;
    return (
        <b className={`hf-x2 ${className}`} title="Hora feliz: doble XP y monedas" role="img" aria-label={`Hora feliz, x${multiplicadorEvento}`}>
            x{multiplicadorEvento}
        </b>
    );
};

/** Sin UI propia: al empezar la ventana con la app abierta lanza confeti y un toast. */
export const HoraFelizAviso = () => {
    const toast = useToast();
    useEffect(() => suscribir('horafeliz', (d) => {
        if (d?.t && d.t === ultimoAviso) return;
        ultimoAviso = d?.t || Date.now();
        lanzarConfeti({ intensidad: 110, colores: COLORES_RAREZA.LEGENDARIO, x: window.innerWidth / 2, y: window.innerHeight * 0.3 });
        toast.success(`¡Empezó la hora feliz! x${d?.multiplicador || 2} en XP y monedas por una hora.`, 5000);
    }), [toast]);
    return null;
};
