import { emitir } from '../../utils/eventosJuego';

/**
 * API imperativa de efectos (la capa <FxLayer /> está montada dentro de GamificacionProvider).
 *
 * lanzarConfeti({ intensidad = 60, x, y, colores })   x/y en px de pantalla (por defecto, centro-arriba)
 * volarMonedas({ cantidad = 5, desde: { x, y } | HTMLElement })  vuela hasta el elemento [data-fx-coins]
 */
export const lanzarConfeti = (opts = {}) => emitir('fx:confeti', opts);
export const volarMonedas = (opts = {}) => emitir('fx:monedas', opts);

export const COLORES_RAREZA = {
    COMUN: ['#9CA3AF', '#22C55E', '#E5E7EB'],
    RARO: ['#3B82F6', '#60A5FA', '#22C55E', '#FFFFFF'],
    EPICO: ['#A855F7', '#D946EF', '#60A5FA', '#FACC15'],
    LEGENDARIO: ['#FACC15', '#F59E0B', '#FDE68A', '#FB923C', '#FFFFFF'],
};
export const INTENSIDAD_RAREZA = { COMUN: 16, RARO: 42, EPICO: 90, LEGENDARIO: 170 };

const centroDe = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Elemento visible con data-fx-coins (chip de monedas del HUD o de la página actual). */
export const encontrarDestinoMonedas = () => {
    if (typeof document === 'undefined') return null;
    const el = [...document.querySelectorAll('[data-fx-coins]')].find((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    });
    if (el) return { el, ...centroDe(el) };
    return { el: null, x: window.innerWidth - 60, y: 40 };
};

/** Genera la trayectoria de cada moneda (fuera del render para mantener pureza). */
export const crearVuelo = (desde, cantidad) => {
    const destino = encontrarDestinoMonedas();
    const n = Math.max(1, Math.min(12, Math.round(cantidad)));
    const inicio = desde instanceof Element ? centroDe(desde) : desde;
    const base = inicio && inicio.x != null ? inicio : { x: window.innerWidth / 2, y: window.innerHeight * 0.7 };
    const monedas = Array.from({ length: n }, (_, i) => ({
        id: i,
        ox: (Math.random() - 0.5) * 120,
        oy: -30 - Math.random() * 70,
        delay: i * 70,
        dur: 800 + Math.random() * 250,
    }));
    return { base, destino, monedas };
};

/** Marca el destino con el "pop" de llegada. */
export const popDestino = (el) => {
    if (!el) return;
    el.classList.remove('fx-pop');
    void el.offsetWidth;
    el.classList.add('fx-pop');
    setTimeout(() => el.classList.remove('fx-pop'), 520);
};
