import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GamificacionContext, { ESTADO_INVITADO } from './gamificacionStore';
import { useAuth } from './AuthContext';
import * as api from '../services/gamificacionApi';

/**
 * Estado de gamificación del usuario (nivel, XP, monedas, racha, equipados).
 * Sin sesión expone un estado "invitado". Otros componentes (chips del mapa,
 * tienda, perfil) leen de aquí con useGamificacion().
 */

// Convierte {"SKIN": articulo} en {"SKIN": "/icons/x.png"}
const imagenesDe = (items) =>
    Object.fromEntries(Object.entries(items || {}).filter(([, a]) => a).map(([cat, a]) => [cat, a.imagen]));

export const GamificacionProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [perfil, setPerfil] = useState(null);
    const [inventario, setInventario] = useState([]);
    const [equipadosItems, setEquipadosItems] = useState({});
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const tokenRef = useRef(token);
    tokenRef.current = token;

    const refresh = useCallback(async () => {
        const t = tokenRef.current;
        if (!t) return null;
        setCargando(true);
        setError(null);
        try {
            const [p, inv] = await Promise.all([api.getPerfil(t), api.getInventario(t).catch(() => null)]);
            setPerfil(p);
            if (inv) {
                setInventario(inv.inventario || []);
                setEquipadosItems(inv.equipados || {});
            }
            return p;
        } catch (e) {
            setError(api.mensajeError(e, 'No pudimos cargar tu progreso.'));
            return null;
        } finally {
            setCargando(false);
        }
    }, []);

    const username = user?.username;
    useEffect(() => {
        if (!username || !token) {
            setPerfil(null);
            setInventario([]);
            setEquipadosItems({});
            setError(null);
            return;
        }
        refresh();
    }, [username, token, refresh]);

    // Mezcla campos nuevos del backend en el perfil actual
    const parchar = useCallback((cambios) => setPerfil((p) => (p ? { ...p, ...cambios } : p)), []);

    const aplicarInventario = useCallback((res) => {
        if (!res) return;
        if (res.inventario) setInventario(res.inventario);
        if (res.equipados) {
            setEquipadosItems(res.equipados);
            parchar({ equipados: imagenesDe(res.equipados) });
        }
        const extra = {};
        if (res.monedas != null) extra.monedas = res.monedas;
        if (res.nivel != null) extra.nivel = res.nivel;
        if (Object.keys(extra).length) parchar(extra);
    }, [parchar]);

    const hacerCheckin = useCallback(async () => {
        const res = await api.postCheckin(tokenRef.current);
        parchar({
            rachaDias: res.rachaDias,
            monedas: res.monedas,
            puntos: res.puntos,
            nivel: res.nivel,
            checkinHoy: true,
        });
        if (!res.yaHecho) refresh();
        return res;
    }, [parchar, refresh]);

    const reclamarMision = useCallback(async (id) => {
        const res = await api.postReclamar(tokenRef.current, id);
        parchar({ monedas: res.monedas, puntos: res.puntos, nivel: res.nivel });
        refresh(); // actualiza xpNivelActual/xpSiguienteNivel y título de rango
        return res;
    }, [parchar, refresh]);

    const comprar = useCallback(async (id) => {
        const res = await api.postComprar(tokenRef.current, id);
        aplicarInventario(res);
        return res;
    }, [aplicarInventario]);

    const equipar = useCallback(async (id) => {
        const res = await api.postEquipar(tokenRef.current, id);
        aplicarInventario(res);
        return res;
    }, [aplicarInventario]);

    const desequipar = useCallback(async (id) => {
        const res = await api.postDesequipar(tokenRef.current, id);
        aplicarInventario(res);
        return res;
    }, [aplicarInventario]);

    const value = useMemo(() => {
        if (!user || !perfil) {
            return {
                ...ESTADO_INVITADO,
                esInvitado: !user,
                cargando: !!user && cargando,
                error,
                refresh,
                hacerCheckin, reclamarMision, comprar, equipar, desequipar,
            };
        }
        return {
            esInvitado: false,
            cargando,
            error,
            perfil,
            nivel: perfil.nivel ?? 1,
            tituloRango: perfil.tituloRango || 'Novato',
            xp: perfil.puntos ?? 0,
            xpNivelActual: perfil.xpNivelActual ?? 0,
            xpSiguienteNivel: perfil.xpSiguienteNivel ?? null,
            monedas: perfil.monedas ?? 0,
            rachaDias: perfil.rachaDias ?? 0,
            checkinHoy: !!perfil.checkinHoy,
            equipados: perfil.equipados || {},
            equipadosItems,
            inventario,
            refresh, hacerCheckin, reclamarMision, comprar, equipar, desequipar,
        };
    }, [user, perfil, cargando, error, equipadosItems, inventario, refresh, hacerCheckin, reclamarMision, comprar, equipar, desequipar]);

    return <GamificacionContext.Provider value={value}>{children}</GamificacionContext.Provider>;
};
