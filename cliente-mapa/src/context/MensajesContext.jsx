import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import MensajesContext from './mensajesStore';
import { useAuth } from './AuthContext';
import { useGamificacion } from '../hooks/useGamificacion';
import { useGlobalSound } from './SoundContext';
import { useToast } from '../components/WeedToast';
import { WS_URL } from '../config';
import { getConversaciones, getNoLeidos, getSolicitudes } from '../services/amigosApi';

const SONDEO_SIN_SOCKET = 15000;
const SONDEO_CON_SOCKET = 60000;

const recortar = (t, n = 60) => {
    const s = String(t ?? '').replace(/\s+/g, ' ').trim();
    return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};

/**
 * Contexto ligero montado una sola vez: mantiene no leídos + solicitudes pendientes
 * y la suscripción STOMP a /user/queue/mensajes (con el JWT en CONNECT).
 * Si el socket cae reconecta solo; mientras tanto sondea cada 15 s.
 */
export const MensajesProvider = ({ children }) => {
    const { token } = useAuth();
    const g = useGamificacion();
    const toast = useToast();
    const { sounds } = useGlobalSound();

    const [noLeidos, setNoLeidos] = useState(0);
    const [solicitudes, setSolicitudes] = useState(0);
    const [conectado, setConectado] = useState(false);

    const oyentes = useRef(new Set());
    const ultimoAviso = useRef(0);
    const timerRefresco = useRef(null);
    const activaRef = useRef(null);
    const yoIdRef = useRef(null);
    const yoId = g.perfil?.usuarioId ?? null;
    useEffect(() => { yoIdRef.current = yoId; }, [yoId]);
    const avisoRef = useRef({ toast, sounds });
    useEffect(() => { avisoRef.current = { toast, sounds }; });

    const refrescar = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        const [nl, sol] = await Promise.all([
            getNoLeidos().catch(() => null),
            getSolicitudes().catch(() => null),
        ]);
        if (nl && typeof nl.total === 'number') setNoLeidos(nl.total);
        if (sol) setSolicitudes(Array.isArray(sol.recibidas) ? sol.recibidas.length : 0);
    }, []);

    const suscribir = useCallback((fn) => {
        oyentes.current.add(fn);
        return () => oyentes.current.delete(fn);
    }, []);

    const setActiva = useCallback((id) => {
        activaRef.current = id == null ? null : Number(id);
    }, []);

    // Aviso (toast + sonido suave) cuando llega un mensaje y no estás en esa conversación
    const avisar = useCallback(async (msg) => {
        let nombre = 'Nuevo mensaje';
        try {
            const convs = await getConversaciones();
            const c = (Array.isArray(convs) ? convs : []).find((x) => Number(x.usuario?.id) === Number(msg.deId));
            if (c?.usuario?.username) nombre = c.usuario.username;
        } catch { /* sin nombre: se usa el genérico */ }
        const { toast: t, sounds: s } = avisoRef.current;
        t.info(`${nombre}: ${recortar(msg.texto)}`, 4500);
        s.notification();
    }, []);

    const alRecibir = useCallback((cuerpo) => {
        let data;
        try { data = JSON.parse(cuerpo); } catch { return; }
        if (!data || typeof data !== 'object') return;
        oyentes.current.forEach((fn) => { try { fn(data); } catch (e) { console.warn('[mensajes]', e); } });
        if (data.tipo === 'leido') return;

        const yo = yoIdRef.current;
        const entrante = yo != null ? Number(data.deId) !== Number(yo) : true;
        if (!entrante) return;
        const enConversacion = activaRef.current === Number(data.deId) && document.visibilityState === 'visible';
        if (enConversacion) return;
        setNoLeidos((n) => n + 1);
        // Una ráfaga de mensajes genera un solo aviso y una sola consulta de contadores
        const ahora = Date.now();
        if (ahora - ultimoAviso.current > 2500) { ultimoAviso.current = ahora; avisar(data); }
        clearTimeout(timerRefresco.current);
        timerRefresco.current = setTimeout(refrescar, 600);
    }, [avisar, refrescar]);
    useEffect(() => () => clearTimeout(timerRefresco.current), []);

    // Conexión STOMP
    useEffect(() => {
        if (!token) return undefined;
        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            beforeConnect: () => {
                client.connectHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
        });
        client.onConnect = () => {
            setConectado(true);
            client.subscribe('/user/queue/mensajes', (m) => alRecibir(m.body));
            refrescar(); // recupera lo que llegó mientras el socket estaba caído
        };
        client.onDisconnect = () => setConectado(false);
        client.onWebSocketClose = () => setConectado(false);
        client.onWebSocketError = () => setConectado(false);
        client.onStompError = () => setConectado(false);
        client.activate();
        return () => {
            setConectado(false);
            client.deactivate();
        };
    }, [token, alRecibir, refrescar]);

    // Contadores: al iniciar sesión, al volver a la pestaña y por sondeo (rápido si no hay socket)
    useEffect(() => {
        if (!token) return undefined;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refrescar();
        const id = setInterval(refrescar, conectado ? SONDEO_CON_SOCKET : SONDEO_SIN_SOCKET);
        const alVolver = () => { if (document.visibilityState === 'visible') refrescar(); };
        document.addEventListener('visibilitychange', alVolver);
        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', alVolver);
        };
    }, [token, conectado, refrescar]);

    const value = useMemo(() => ({
        noLeidos: token ? noLeidos : 0,
        solicitudes: token ? solicitudes : 0,
        total: token ? noLeidos + solicitudes : 0,
        conectado,
        refrescar,
        suscribir,
        setActiva,
    }), [token, noLeidos, solicitudes, conectado, refrescar, suscribir, setActiva]);

    return <MensajesContext.Provider value={value}>{children}</MensajesContext.Provider>;
};

export default MensajesProvider;
