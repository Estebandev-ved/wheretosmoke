import { useMemo } from 'react';

const PATRONES = {
    tap: 10,
    exito: [15, 40, 25],
    premio: [20, 50, 20, 50, 60],
    nivel: [30, 60, 30, 60, 30, 60, 140],
};

/** Vibra con un patrón nombrado. Seguro si el dispositivo no soporta vibración. */
export const vibrar = (nombre) => {
    try {
        if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
        return navigator.vibrate(PATRONES[nombre] ?? nombre);
    } catch {
        return false;
    }
};

/** useHaptics() -> { tap, exito, premio, nivel, vibrar } */
export const useHaptics = () => useMemo(() => ({
    tap: () => vibrar('tap'),
    exito: () => vibrar('exito'),
    premio: () => vibrar('premio'),
    nivel: () => vibrar('nivel'),
    vibrar,
}), []);

export default useHaptics;
