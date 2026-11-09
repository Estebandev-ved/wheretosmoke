import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';
const suscribir = (cb) => {
    const mq = window.matchMedia?.(QUERY);
    mq?.addEventListener?.('change', cb);
    return () => mq?.removeEventListener?.('change', cb);
};
const leer = () => !!window.matchMedia?.(QUERY).matches;

export const useReducedMotion = () => useSyncExternalStore(suscribir, leer, () => false);
export default useReducedMotion;
