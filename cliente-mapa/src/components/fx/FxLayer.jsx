import React, { useCallback, useEffect, useRef, useState } from 'react';
import Confeti from './Confeti';
import MonedasVoladoras from './MonedasVoladoras';
import LlamaRacha from './LlamaRacha';
import { crearVuelo, COLORES_RAREZA, INTENSIDAD_RAREZA } from './fxApi';
import { suscribir } from '../../utils/eventosJuego';
import { vibrar } from '../../hooks/useHaptics';
import { useGlobalSound } from '../../context/SoundContext';
import { reducirMovimiento } from '../../utils/movimiento';
import './fx.css';

const cantidadMonedas = (m) => Math.min(10, Math.max(3, Math.ceil((m || 0) / 4)));

/**
 * Capa global de celebraciones. Escucha el bus de eventos del juego (utils/eventosJuego)
 * y dispara confeti, monedas voladoras, sonido y háptica. Se monta una sola vez
 * dentro de GamificacionProvider.
 */
const FxLayer = () => {
    const { sounds } = useGlobalSound();
    const soundsRef = useRef(sounds);
    useEffect(() => { soundsRef.current = sounds; });

    const [confetis, setConfetis] = useState([]);
    const [vuelos, setVuelos] = useState([]);
    const [banner, setBanner] = useState(null);
    const contador = useRef(0);
    const puntero = useRef(null);
    const teclado = useRef(false);
    const timerBanner = useRef(null);

    // Posición del último toque: de ahí salen el confeti y las monedas
    useEffect(() => {
        const abajo = (e) => { teclado.current = false; puntero.current = { x: e.clientX, y: e.clientY }; };
        const tecla = () => { teclado.current = true; };
        window.addEventListener('pointerdown', abajo, true);
        window.addEventListener('keydown', tecla, true);
        return () => {
            window.removeEventListener('pointerdown', abajo, true);
            window.removeEventListener('keydown', tecla, true);
        };
    }, []);

    const origenActual = useCallback(() => {
        if (teclado.current && document.activeElement && document.activeElement !== document.body) {
            const r = document.activeElement.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
        return puntero.current;
    }, []);

    const confeti = useCallback((opts = {}) => {
        const o = opts.x != null ? { x: opts.x, y: opts.y } : origenActual();
        const id = ++contador.current;
        setConfetis((l) => [...l, { id, intensidad: opts.intensidad ?? 60, origen: o || undefined, colores: opts.colores }]);
    }, [origenActual]);

    const monedas = useCallback((opts = {}) => {
        if (reducirMovimiento()) return;
        const id = ++contador.current;
        const vuelo = crearVuelo(opts.desde || origenActual(), opts.cantidad ?? 5);
        setVuelos((l) => [...l, { id, vuelo }]);
    }, [origenActual]);

    useEffect(() => {
        const s = () => soundsRef.current;
        const quitar = [
            suscribir('fx:confeti', (o) => confeti(o)),
            suscribir('fx:monedas', (o) => monedas(o)),
            suscribir('checkin', (d) => {
                if (d?.yaHecho) return;
                s().coin();
                vibrar('exito');
                const dias = d?.rachaDias ?? 1;
                confeti({ intensidad: 40 + Math.min(dias, 30) * 3 });
                monedas({ cantidad: cantidadMonedas(d?.monedasGanadas) });
                setBanner({ dias });
                clearTimeout(timerBanner.current);
                timerBanner.current = setTimeout(() => setBanner(null), 2600);
            }),
            suscribir('mision', (d) => {
                s().coin();
                vibrar('premio');
                confeti({ intensidad: 48 });
                monedas({ cantidad: cantidadMonedas(d?.monedasGanadas) });
            }),
            suscribir('compra', (d) => {
                const rareza = d?.articulo?.rareza || 'COMUN';
                const base = INTENSIDAD_RAREZA[rareza] ?? 16;
                const colores = COLORES_RAREZA[rareza];
                if (d?.accion === 'equipar') {
                    s().pop();
                    vibrar('tap');
                    confeti({ intensidad: Math.round(base * 0.5), colores });
                    return;
                }
                if (rareza === 'COMUN') s().pop(); else s().success();
                if (rareza === 'EPICO' || rareza === 'LEGENDARIO') setTimeout(() => s().achievement(), 350);
                vibrar(rareza === 'COMUN' ? 'tap' : rareza === 'RARO' ? 'exito' : 'premio');
                confeti({ intensidad: base, colores });
            }),
            suscribir('cofre', (d) => {
                s().coin();
                setTimeout(() => s().success(), 250);
                vibrar('premio');
                confeti({ intensidad: 120, x: window.innerWidth / 2, y: window.innerHeight * 0.45 });
                if (d?.monedasGanadas) monedas({ cantidad: cantidadMonedas(d.monedasGanadas) });
            }),
        ];
        return () => { quitar.forEach((f) => f()); clearTimeout(timerBanner.current); };
    }, [confeti, monedas]);

    return (
        <>
            {confetis.map((c) => (
                <Confeti
                    key={c.id}
                    intensidad={c.intensidad}
                    origen={c.origen}
                    colores={c.colores}
                    onDone={() => setConfetis((l) => l.filter((x) => x.id !== c.id))}
                />
            ))}
            {vuelos.map((v) => (
                <MonedasVoladoras key={v.id} vuelo={v.vuelo} onDone={() => setVuelos((l) => l.filter((x) => x.id !== v.id))} />
            ))}
            {banner && (
                <div className="fx-racha-banner" role="status">
                    <LlamaRacha dias={banner.dias} size={44} />
                    <strong>¡Racha de {banner.dias} {banner.dias === 1 ? 'día' : 'días'}!</strong>
                </div>
            )}
        </>
    );
};

export default FxLayer;
