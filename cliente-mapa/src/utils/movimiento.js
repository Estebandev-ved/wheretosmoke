/** true si el usuario pidió menos movimiento (prefers-reduced-motion). */
export const reducirMovimiento = () =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
