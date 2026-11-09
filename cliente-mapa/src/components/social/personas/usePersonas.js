import { useCallback, useEffect, useRef, useState } from 'react';
import { getSugeridas, descubrirPersonas, estadoHttp, mensajeError } from '../../../services/amigosApi';

const LLAVE_DESCARTADAS = 'wts_personas_descartadas';

/** Ids de sugerencias descartadas (localStorage, tolerante a fallos). */
export const leerDescartadas = () => {
    try {
        const v = JSON.parse(localStorage.getItem(LLAVE_DESCARTADAS) || '[]');
        return Array.isArray(v) ? v : [];
    } catch { return []; }
};
export const guardarDescartada = (id) => {
    try {
        const lista = [id, ...leerDescartadas().filter((x) => x !== id)].slice(0, 300);
        localStorage.setItem(LLAVE_DESCARTADAS, JSON.stringify(lista));
    } catch { /* sin almacenamiento: el descarte solo dura la sesión */ }
};

const VACIO = { clave: null, items: [], pagina: 0, hayMas: false, error: null, masCargando: false };

/**
 * Lista paginada de personas. tipo: 'sugeridas' | 'descubrir'. Cambiar `params` reinicia la lista.
 * Un 404 (backend sin el endpoint) se trata como lista vacía.
 */
export default function usePersonas(tipo, params = {}, { limite = 10, activo = true } = {}) {
    const clave = JSON.stringify([tipo, params, limite]);
    const [est, setEst] = useState(VACIO);
    const [intento, setIntento] = useState(0);
    const turno = useRef(0);
    const vigente = est.clave === clave;

    const pedir = useCallback(async (pagina) => {
        const [t, p, l] = JSON.parse(clave);
        const mia = ++turno.current;
        try {
            const d = await (t === 'sugeridas' ? getSugeridas : descubrirPersonas)({ ...p, pagina, limite: l });
            if (mia !== turno.current) return;
            const nuevos = Array.isArray(d?.items) ? d.items : [];
            setEst((e) => {
                const base = e.clave === clave && pagina > 0 ? e.items : [];
                const vistos = new Set(base.map((x) => x.id));
                return { clave, items: [...base, ...nuevos.filter((x) => !vistos.has(x.id))], pagina, hayMas: !!d?.hayMas, error: null, masCargando: false };
            });
        } catch (e) {
            if (mia !== turno.current) return;
            if (estadoHttp(e) === 404) { setEst({ ...VACIO, clave }); return; }
            setEst((s) => ({ ...(s.clave === clave ? s : VACIO), clave, error: mensajeError(e, 'No pudimos cargar a las personas.'), masCargando: false }));
        }
    }, [clave]);

    useEffect(() => {
        if (activo) pedir(0);
        return () => { turno.current += 1; };
    }, [activo, pedir, intento]);

    const cargarMas = useCallback(() => {
        if (!vigente || est.masCargando || !est.hayMas || est.error) return;
        setEst((e) => ({ ...e, masCargando: true }));
        pedir(est.pagina + 1);
    }, [vigente, est, pedir]);

    const reintentar = useCallback(() => {
        setEst((e) => (e.items.length ? { ...e, error: null } : VACIO));
        setIntento((n) => n + 1);
    }, []);

    const actualizar = useCallback((id, parcial) => setEst((e) => ({ ...e, items: e.items.map((u) => (u.id === id ? { ...u, ...parcial } : u)) })), []);
    const quitar = useCallback((id) => setEst((e) => ({ ...e, items: e.items.filter((u) => u.id !== id) })), []);

    return {
        items: vigente ? est.items : [],
        cargando: activo && !(vigente && est.error) && !vigente,
        masCargando: vigente && est.masCargando,
        error: vigente ? est.error : null,
        hayMas: vigente && est.hayMas,
        cargarMas, reintentar, actualizar, quitar,
    };
}
