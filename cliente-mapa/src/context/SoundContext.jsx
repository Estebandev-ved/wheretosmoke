import React, { createContext, useContext } from 'react';
import useSound from '../hooks/useSound';

/**
 * 🔊 SOUND PROVIDER - Contexto global para sonidos
 * 
 * Provee acceso global al sistema de sonidos
 */

const SoundContext = createContext();

export const useGlobalSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useGlobalSound must be used within SoundProvider');
    }
    return context;
};

export const SoundProvider = ({ children }) => {
    const soundSystem = useSound();

    return (
        <SoundContext.Provider value={soundSystem}>
            {children}
        </SoundContext.Provider>
    );
};
