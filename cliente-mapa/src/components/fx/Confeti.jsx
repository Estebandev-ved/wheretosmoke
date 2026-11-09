import React, { useEffect, useRef } from 'react';
import { reducirMovimiento } from '../../utils/movimiento';

const COLORES = ['#22C55E', '#FACC15', '#60A5FA', '#F472B6', '#FB923C', '#FFFFFF'];

/**
 * Confeti en canvas. Se auto-destruye (onDone) al terminar.
 * Props: intensidad (n.º de piezas), origen {x,y} en px, colores [], onDone().
 * Con prefers-reduced-motion no dibuja nada y llama onDone enseguida.
 */
const Confeti = ({ intensidad = 60, origen, colores = COLORES, onDone }) => {
    const ref = useRef(null);
    const doneRef = useRef(onDone);
    useEffect(() => { doneRef.current = onDone; });

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas || reducirMovimiento()) {
            doneRef.current?.();
            return undefined;
        }
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const ox = origen?.x ?? w / 2;
        const oy = origen?.y ?? h * 0.35;
        const piezas = Array.from({ length: Math.min(260, intensidad) }, () => {
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
            const vel = 5 + Math.random() * 9;
            return {
                x: ox, y: oy,
                vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel,
                tam: 5 + Math.random() * 6,
                rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
                color: colores[Math.floor(Math.random() * colores.length)],
                redonda: Math.random() < 0.3,
            };
        });

        let raf;
        const inicio = performance.now();
        const paso = (t) => {
            const ms = t - inicio;
            ctx.clearRect(0, 0, w, h);
            let vivas = 0;
            const fade = ms > 1800 ? Math.max(0, 1 - (ms - 1800) / 900) : 1;
            piezas.forEach((p) => {
                p.vy += 0.28; p.vx *= 0.992; p.vy *= 0.992;
                p.x += p.vx; p.y += p.vy; p.rot += p.vr;
                if (p.y < h + 20) vivas += 1;
                ctx.save();
                ctx.globalAlpha = fade;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                if (p.redonda) { ctx.beginPath(); ctx.arc(0, 0, p.tam / 2, 0, Math.PI * 2); ctx.fill(); }
                else ctx.fillRect(-p.tam / 2, -p.tam / 3, p.tam, p.tam * 0.6);
                ctx.restore();
            });
            if (vivas > 0 && ms < 2700) raf = requestAnimationFrame(paso);
            else doneRef.current?.();
        };
        raf = requestAnimationFrame(paso);
        return () => cancelAnimationFrame(raf);
        // Se dibuja una sola vez con las props iniciales
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <canvas ref={ref} className="fx-confeti" aria-hidden="true" />;
};

export default Confeti;
