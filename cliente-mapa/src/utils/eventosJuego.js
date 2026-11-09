/**
 * Bus de eventos del juego (pub/sub sin dependencias).
 *
 * Eventos que emite GamificacionContext:
 *   'checkin' -> respuesta de /gamificacion/checkin ({ rachaDias, monedasGanadas, xpGanado, yaHecho... })
 *   'mision'  -> respuesta de reclamar ({ monedasGanadas, xpGanado, subioNivel... })
 *   'nivel'   -> { nivel } (una sola vez por nivel, tambien tras recargar)
 *   'compra'  -> { articulo, accion: 'comprar' | 'equipar' }
 *   'cofre'   -> respuesta de abrir cofre ({ monedasGanadas, rareza... })
 * Otros: 'tour:abrir' (relanza el tour), 'fx:confeti', 'fx:monedas' (ver components/fx/fxApi.js).
 *
 * suscribir('*', (tipo, datos) => ...) recibe todos los eventos.
 * suscribir devuelve la funcion para cancelar la suscripcion.
 */
const oyentes = new Map();

export const suscribir = (tipo, fn) => {
    if (!oyentes.has(tipo)) oyentes.set(tipo, new Set());
    oyentes.get(tipo).add(fn);
    return () => oyentes.get(tipo)?.delete(fn);
};

export const emitir = (tipo, datos = {}) => {
    const llamar = (fn, ...args) => {
        try { fn(...args); } catch (e) { console.warn('[eventosJuego]', tipo, e); }
    };
    oyentes.get(tipo)?.forEach((fn) => llamar(fn, datos));
    oyentes.get('*')?.forEach((fn) => llamar(fn, tipo, datos));
};
