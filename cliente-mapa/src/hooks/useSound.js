import { useState, useEffect, useCallback } from 'react';

/**
 * 🔊 SOUND HOOK - Sistema de efectos de sonido
 * 
 * Hook para reproducir sonidos con control de volumen y toggle
 */

const useSound = () => {
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('soundEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [volume, setVolume] = useState(0.3);

    const toggleSound = useCallback(() => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        localStorage.setItem('soundEnabled', JSON.stringify(newState));
    }, [soundEnabled]);

    const playSound = useCallback((soundName) => {
        if (!soundEnabled) return;

        try {
            const audio = new Audio(`/sounds/${soundName}.mp3`);
            audio.volume = volume;
            audio.play().catch(err => {
                console.warn('Sound play failed:', err);
            });
        } catch (error) {
            console.warn('Sound not found:', soundName);
        }
    }, [soundEnabled, volume]);

    const sounds = {
        click: () => playSound('click'),
        success: () => playSound('success'),
        error: () => playSound('error'),
        levelUp: () => playSound('level-up'),
        notification: () => playSound('notification'),
        vote: () => playSound('vote'),
        achievement: () => playSound('achievement')
    };

    return {
        sounds,
        soundEnabled,
        toggleSound,
        volume,
        setVolume
    };
};

export default useSound;
