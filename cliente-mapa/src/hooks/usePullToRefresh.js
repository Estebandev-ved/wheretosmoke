import { useCallback, useRef, useState } from 'react';

const UMBRAL = 64;
const MAX = 96;

/**
 * Pull-to-refresh simple para contenedores con scroll propio.
 * const { bind, pull, refrescando } = usePullToRefresh(async () => {...});
 * <main {...bind}> ... <IndicadorPull pull={pull} refrescando={refrescando} />
 */
export const usePullToRefresh = (onRefresh) => {
    const [pull, setPull] = useState(0);
    const [refrescando, setRefrescando] = useState(false);
    const inicio = useRef(null);

    const onTouchStart = useCallback((e) => {
        if (refrescando || e.currentTarget.scrollTop > 0) { inicio.current = null; return; }
        inicio.current = e.touches[0].clientY;
    }, [refrescando]);

    const onTouchMove = useCallback((e) => {
        if (inicio.current == null) return;
        const dy = e.touches[0].clientY - inicio.current;
        if (dy <= 0 || e.currentTarget.scrollTop > 0) { if (dy <= 0) setPull(0); return; }
        setPull(Math.min(MAX, dy * 0.5));
    }, []);

    const terminar = useCallback(async () => {
        if (inicio.current == null) return;
        inicio.current = null;
        if (pull >= UMBRAL) {
            setRefrescando(true);
            setPull(UMBRAL * 0.8);
            try { await onRefresh?.(); } catch { /* el llamador maneja sus errores */ }
            setRefrescando(false);
        }
        setPull(0);
    }, [pull, onRefresh]);

    return {
        pull, refrescando, umbral: UMBRAL,
        bind: { onTouchStart, onTouchMove, onTouchEnd: terminar, onTouchCancel: terminar },
    };
};

export default usePullToRefresh;
