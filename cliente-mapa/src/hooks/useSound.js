import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Sistema de sonidos sintetizados con WebAudio (sin archivos binarios).
 * Respeta el toggle persistente (localStorage 'soundEnabled').
 * sounds: click, pop, coin, success, error, levelUp, notification, vote, achievement
 */

const LS_KEY = 'soundEnabled';

const leerActivado = () => {
    try {
        const saved = localStorage.getItem(LS_KEY);
        return saved !== null ? JSON.parse(saved) !== false : true;
    } catch {
        return true;
    }
};

// Notas: [frecuencia Hz, inicio s, duración s, tipo, volumen relativo, frecuencia final opcional]
const NOTAS = {
    click: [[700, 0, 0.05, 'sine', 0.6, 420]],
    pop: [[420, 0, 0.09, 'sine', 0.9, 980]],
    coin: [[988, 0, 0.07, 'square', 0.35], [1319, 0.07, 0.22, 'square', 0.35]],
    success: [[523, 0, 0.12, 'triangle', 0.8], [659, 0.09, 0.12, 'triangle', 0.8], [784, 0.18, 0.28, 'triangle', 0.8]],
    error: [[220, 0, 0.16, 'sawtooth', 0.4, 150], [150, 0.14, 0.24, 'sawtooth', 0.4, 100]],
    levelUp: [
        [523, 0, 0.13, 'triangle', 0.8], [659, 0.11, 0.13, 'triangle', 0.8], [784, 0.22, 0.13, 'triangle', 0.8],
        [1047, 0.33, 0.2, 'triangle', 0.85], [1319, 0.5, 0.18, 'square', 0.3], [1568, 0.62, 0.45, 'triangle', 0.8],
    ],
    notification: [[880, 0, 0.1, 'sine', 0.7], [1175, 0.12, 0.2, 'sine', 0.7]],
    vote: [[520, 0, 0.07, 'sine', 0.8, 780]],
    achievement: [[659, 0, 0.1, 'triangle', 0.8], [880, 0.1, 0.1, 'triangle', 0.8], [1175, 0.2, 0.32, 'triangle', 0.8]],
};

const useSound = () => {
    const [soundEnabled, setSoundEnabled] = useState(leerActivado);
    const [volume, setVolume] = useState(0.3);
    const ctxRef = useRef(null);
    const estado = useRef({ soundEnabled, volume });
    useEffect(() => { estado.current = { soundEnabled, volume }; }, [soundEnabled, volume]);

    const toggleSound = useCallback(() => {
        setSoundEnabled((prev) => {
            const nuevo = !prev;
            try { localStorage.setItem(LS_KEY, JSON.stringify(nuevo)); } catch { /* sin almacenamiento */ }
            return nuevo;
        });
    }, []);

    const playSound = useCallback((nombre) => {
        const { soundEnabled: activo, volume: vol } = estado.current;
        if (!activo) return;
        const notas = NOTAS[nombre];
        if (!notas) return;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            if (!ctxRef.current) ctxRef.current = new AC();
            const ctx = ctxRef.current;
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            const t0 = ctx.currentTime + 0.01;
            notas.forEach(([freq, ini, dur, tipo, rel, fin]) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = tipo;
                osc.frequency.setValueAtTime(freq, t0 + ini);
                if (fin) osc.frequency.exponentialRampToValueAtTime(fin, t0 + ini + dur);
                const pico = Math.max(0.0002, vol * rel * 0.5);
                gain.gain.setValueAtTime(0.0001, t0 + ini);
                gain.gain.exponentialRampToValueAtTime(pico, t0 + ini + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, t0 + ini + dur);
                osc.connect(gain).connect(ctx.destination);
                osc.start(t0 + ini);
                osc.stop(t0 + ini + dur + 0.05);
            });
        } catch (error) {
            console.warn('Sound play failed:', nombre, error);
        }
    }, []);

    const sounds = useMemo(() => ({
        click: () => playSound('click'),
        pop: () => playSound('pop'),
        coin: () => playSound('coin'),
        success: () => playSound('success'),
        error: () => playSound('error'),
        levelUp: () => playSound('levelUp'),
        notification: () => playSound('notification'),
        vote: () => playSound('vote'),
        achievement: () => playSound('achievement'),
    }), [playSound]);

    return { sounds, soundEnabled, toggleSound, volume, setVolume };
};

export default useSound;
