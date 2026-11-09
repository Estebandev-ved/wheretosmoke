import { useCallback, useEffect, useRef, useState } from 'react';
import { getEvento } from '../services/gamificacionApi';

const RESYNC_MS = 60000;

/**
 * Hora feliz 4:20 (04:20-05:20 y 16:20-17:20, hora de Bogotá; x2 XP y monedas).
 * Consulta GET /gamificacion/evento al montar, guarda los instantes absolutos de fin / próxima
 * ventana y se resincroniza cada ~60 s, al volver la pestaña a primer plano y justo en cada cambio
 * de ventana. Cambia de estado solo en transiciones (no cada segundo): la cuenta atrás visible
 * vive en useSegundosHasta(). Si el backend no responde devuelve null (la UI se oculta).
 *
 * Devuelve { activo, multiplicador, finMs, proximaMs } | null
 */
export const useEventoHoraFeliz = ({ onInicio } = {}) => {
    const [ev, setEv] = useState(null);
    const evRef = useRef(null);
    const inicioRef = useRef(onInicio);
    useEffect(() => { inicioRef.current = onInicio; });

    const cargar = useCallback(async () => {
        try {
            const d = await getEvento();
            if (!d || typeof d.activo !== 'boolean') return;
            const ahora = Date.now();
            const nuevo = {
                activo: d.activo,
                multiplicador: d.multiplicador > 1 ? d.multiplicador : 1,
                finMs: d.activo ? ahora + (d.segundosRestantes || 0) * 1000 : null,
                proximaMs: d.activo ? null : ahora + (d.segundosParaProxima || 0) * 1000,
            };
            const prev = evRef.current;
            const borde = (e) => (e.activo ? e.finMs : e.proximaMs);
            // Misma ventana (±3 s de deriva): no re-renderiza
            if (prev && prev.activo === nuevo.activo && prev.multiplicador === nuevo.multiplicador
                && Math.abs((borde(prev) || 0) - (borde(nuevo) || 0)) < 3000) return;
            evRef.current = nuevo;
            setEv(nuevo);
            if (prev && !prev.activo && nuevo.activo) inicioRef.current?.(nuevo);
        } catch {
            /* sin respuesta: se conserva lo último conocido (o nada) */
        }
    }, []);

    // Carga inicial + resincronización periódica + al volver a primer plano
    useEffect(() => {
        const primera = setTimeout(cargar, 0);
        const id = setInterval(cargar, RESYNC_MS);
        const visible = () => { if (document.visibilityState === 'visible') cargar(); };
        document.addEventListener('visibilitychange', visible);
        window.addEventListener('focus', visible);
        return () => {
            clearTimeout(primera);
            clearInterval(id);
            document.removeEventListener('visibilitychange', visible);
            window.removeEventListener('focus', visible);
        };
    }, [cargar]);

    // Resincroniza exactamente cuando empieza / termina la ventana
    const borde = ev ? (ev.activo ? ev.finMs : ev.proximaMs) : null;
    useEffect(() => {
        if (!borde) return undefined;
        const espera = Math.min(2147000000, Math.max(0, borde - Date.now()) + 400);
        const id = setTimeout(cargar, espera);
        return () => clearTimeout(id);
    }, [borde, cargar]);

    return ev;
};

/** Segundos que faltan hasta un instante (ms epoch); se actualiza cada segundo. null si no hay objetivo. */
export const useSegundosHasta = (objetivoMs) => {
    const [ahora, setAhora] = useState(() => Date.now());
    useEffect(() => {
        if (objetivoMs == null) return undefined;
        const id = setInterval(() => setAhora(Date.now()), 1000);
        return () => clearInterval(id);
    }, [objetivoMs]);
    if (objetivoMs == null) return null;
    return Math.max(0, Math.ceil((objetivoMs - ahora) / 1000));
};

/** 12:30 o 03:12:45 */
export const formatoReloj = (s) => {
    if (s == null) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const seg = s % 60;
    const dos = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${dos(h)}:${dos(m)}:${dos(seg)}` : `${dos(m)}:${dos(seg)}`;
};

/** Próxima medianoche de Bogotá (UTC-5 fijo, sin horario de verano), en ms epoch. */
export const proximaMedianocheBogota = (desdeMs = Date.now()) => {
    const OFFSET = 5 * 3600 * 1000;
    const DIA = 86400 * 1000;
    const local = desdeMs - OFFSET;
    return Math.floor(local / DIA) * DIA + DIA + OFFSET;
};
