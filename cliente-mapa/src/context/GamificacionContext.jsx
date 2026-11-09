import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GamificacionContext, { ESTADO_INVITADO } from './gamificacionStore';
import { useAuth } from './AuthContext';
import * as api from '../services/gamificacionApi';
import { emitir } from '../utils/eventosJuego';
import { useEventoHoraFeliz } from '../hooks/useEventoHoraFeliz';
import { lanzarConfeti, COLORES_RAREZA } from '../components/fx/fxApi';
import FxLayer from '../components/fx/FxLayer';
import SubidaDeNivel from '../components/fx/SubidaDeNivel';

/**
 * Estado de gamificación del usuario (nivel, XP, monedas, racha, equipados).
 * Sin sesión expone un estado "invitado". Otros componentes (chips del mapa,
 * tienda, perfil) leen de aquí con useGamificacion().
 */

// Convierte {"SKIN": articulo} en {"SKIN": "/icons/x.png"}
const imagenesDe = (items) =>
    Object.fromEntries(Object.entries(items || {}).filter(([, a]) => a).map(([cat, a]) => [cat, a.imagen]));

const claveNivel = (u) => `wts:nivelVisto:${u}`;
const leerNivelVisto = (u) => {
    try {
        const n = parseInt(localStorage.getItem(claveNivel(u)), 10);
        return Number.isNaN(n) ? null : n;
    } catch { return null; }
};
const guardarNivelVisto = (u, n) => {
    try { localStorage.setItem(claveNivel(u), String(n)); } catch { /* sin almacenamiento */ }
};

export const GamificacionProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [perfil, setPerfil] = useState(null);
    const [inventario, setInventario] = useState([]);
    const [equipadosItems, setEquipadosItems] = useState({});
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [subida, setSubida] = useState(null); // { nivel } mientras se muestra la pantalla de subida de nivel
    const tokenRef = useRef(token);
    tokenRef.current = token;
    const usernameRef = useRef(user?.username);
    usernameRef.current = user?.username;

    // Hora feliz 4:20: estado público (también para invitados); solo cambia en transiciones
    const evento = useEventoHoraFeliz({ onInicio: (e) => emitir('horafeliz', { multiplicador: e.multiplicador, t: Date.now() }) });
    const multiplicadorEvento = evento?.activo ? evento.multiplicador : 1;

    // Compara con el último nivel celebrado (persistido por usuario): celebra una sola vez, también tras recargar.
    const revisarNivel = useCallback((nivel) => {
        const u = usernameRef.current;
        if (!u || nivel == null) return;
        const visto = leerNivelVisto(u);
        if (visto == null || nivel < visto) { guardarNivelVisto(u, nivel); return; } // primera vez: sin celebrar
        if (nivel > visto) {
            guardarNivelVisto(u, nivel);
            emitir('nivel', { nivel });
            setTimeout(() => setSubida({ nivel }), 1100); // deja ver antes las monedas y el confeti
        }
    }, []);

    const refresh = useCallback(async () => {
        const t = tokenRef.current;
        if (!t) return null;
        setCargando(true);
        setError(null);
        try {
            const [p, inv] = await Promise.all([api.getPerfil(t), api.getInventario(t).catch(() => null)]);
            setPerfil(p);
            revisarNivel(p?.nivel);
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
    }, [revisarNivel]);

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
    const parchar = useCallback((cambios) => {
        setPerfil((p) => (p ? { ...p, ...cambios } : p));
        if (cambios.nivel != null) revisarNivel(cambios.nivel);
    }, [revisarNivel]);

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
        if (!res.yaHecho) {
            emitir('checkin', res);
            if (res.multiplicador > 1) lanzarConfeti({ intensidad: 50, colores: COLORES_RAREZA.LEGENDARIO });
            refresh();
        }
        return res;
    }, [parchar, refresh]);

    const reclamarMision = useCallback(async (id) => {
        const res = await api.postReclamar(tokenRef.current, id);
        parchar({ monedas: res.monedas, puntos: res.puntos, nivel: res.nivel });
        emitir('mision', res);
        if (res.multiplicador > 1) lanzarConfeti({ intensidad: 40, colores: COLORES_RAREZA.LEGENDARIO });
        refresh(); // actualiza xpNivelActual/xpSiguienteNivel y título de rango
        return res;
    }, [parchar, refresh]);

    const articuloDe = (res, id) =>
        res?.inventario?.find((a) => a.id === id) || Object.values(res?.equipados || {}).find((a) => a?.id === id) || { id };

    const comprar = useCallback(async (id) => {
        const res = await api.postComprar(tokenRef.current, id);
        aplicarInventario(res);
        emitir('compra', { articulo: articuloDe(res, id), accion: 'comprar' });
        return res;
    }, [aplicarInventario]);

    const equipar = useCallback(async (id) => {
        const res = await api.postEquipar(tokenRef.current, id);
        aplicarInventario(res);
        emitir('compra', { articulo: articuloDe(res, id), accion: 'equipar' });
        return res;
    }, [aplicarInventario]);

    const desequipar = useCallback(async (id) => {
        const res = await api.postDesequipar(tokenRef.current, id);
        aplicarInventario(res);
        return res;
    }, [aplicarInventario]);

    // ── Fase siguiente: no se llaman al cargar. Tolerantes a 404 (devuelven null). ──
    const getEvento = useCallback(() => api.getEvento(tokenRef.current), []);
    const getAlbum = useCallback(() => api.getAlbum(tokenRef.current), []);
    // Solo llama al backend: la página anima la apertura y luego llama aplicarCofre(res) al revelar el premio
    const abrirCofre = useCallback(() => api.abrirCofre(tokenRef.current), []);
    const aplicarCofre = useCallback((res) => {
        if (!res) return;
        const cambios = {};
        if (res.saldoMonedas != null) cambios.monedas = res.saldoMonedas;
        if (res.puntos != null) cambios.puntos = res.puntos;
        if (res.nivel != null) cambios.nivel = res.nivel;
        if (!res.yaAbierto) cambios.cofreDisponible = false;
        if (Object.keys(cambios).length) parchar(cambios);
        // El bus (FxLayer) espera monedasGanadas; el contrato del cofre trae `monedas`
        if (!res.yaAbierto) emitir('cofre', { ...res, monedasGanadas: res.monedas || 0 });
        refresh();
    }, [parchar, refresh]);

    const value = useMemo(() => {
        if (!user || !perfil) {
            return {
                ...ESTADO_INVITADO,
                esInvitado: !user,
                cargando: !!user && cargando,
                error,
                refresh,
                hacerCheckin, reclamarMision, comprar, equipar, desequipar,
                getEvento, getAlbum, abrirCofre, aplicarCofre,
                evento, multiplicadorEvento, cofreDisponible: false,
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
            getEvento, getAlbum, abrirCofre, aplicarCofre,
            evento, multiplicadorEvento,
            cofreDisponible: perfil.cofreDisponible,
        };
    }, [user, perfil, cargando, error, equipadosItems, inventario, refresh, hacerCheckin, reclamarMision, comprar, equipar, desequipar, getEvento, getAlbum, abrirCofre, aplicarCofre, evento, multiplicadorEvento]);

    // Si cambia la sesión, la pantalla de subida de nivel de otro usuario no debe seguir abierta
    const subidaActiva = user ? subida : null;

    return (
        <GamificacionContext.Provider value={value}>
            {children}
            <FxLayer />
            {subidaActiva && (
                <SubidaDeNivel
                    nivel={subidaActiva.nivel}
                    titulo={perfil?.tituloRango}
                    imagen={equipadosItems?.MASCOTA?.imagen}
                    onClose={() => setSubida(null)}
                />
            )}
        </GamificacionContext.Provider>
    );
};
