import React, { createContext, useContext, useState, useCallback } from 'react';
import './particle-effects.css';

/**
 * 💨 PARTICLE EFFECTS - Sistema de partículas interactivas
 * 
 * Efectos visuales según acciones del usuario:
 * - Spot creado: Explosión de hojas verdes
 * - Vote RELAX: Humo verde
 * - Vote TOMBO: Humo rojo
 * - Logro desbloqueado: Confetti dorado
 * - Favorito: Corazones + hojas
 */

const ParticleContext = createContext();

export const useParticles = () => {
    const context = useContext(ParticleContext);
    if (!context) {
        throw new Error('useParticles must be used within ParticleProvider');
    }
    return context;
};

const ParticleEffect = ({ id, type, x, y, onComplete }) => {
    const particles = Array.from({ length: getParticleCount(type) }, (_, i) => ({
        id: i,
        emoji: getEmoji(type, i),
        angle: (360 / getParticleCount(type)) * i,
        delay: Math.random() * 0.2
    }));

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onComplete(id);
        }, 2000);
        return () => clearTimeout(timer);
    }, [id, onComplete]);

    return (
        <div
            className={`particle-effect particle-${type}`}
            style={{ left: `${x}px`, top: `${y}px` }}
        >
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="particle"
                    style={{
                        '--angle': `${particle.angle}deg`,
                        animationDelay: `${particle.delay}s`
                    }}
                >
                    {particle.emoji}
                </div>
            ))}
        </div>
    );
};

function getParticleCount(type) {
    switch (type) {
        case 'spot-created': return 15;
        case 'vote-relax': return 8;
        case 'vote-tombo': return 8;
        case 'achievement': return 20;
        case 'favorite': return 12;
        default: return 10;
    }
}

function getEmoji(type, index) {
    switch (type) {
        case 'spot-created': return '🍃';
        case 'vote-relax': return index % 2 === 0 ? '🍃' : '💨';
        case 'vote-tombo': return index % 2 === 0 ? '🚨' : '💨';
        case 'achievement': return index % 3 === 0 ? '⭐' : (index % 3 === 1 ? '🏆' : '✨');
        case 'favorite': return index % 2 === 0 ? '❤️' : '🍃';
        default: return '✨';
    }
}

export const ParticleProvider = ({ children }) => {
    const [effects, setEffects] = useState([]);

    const trigger = useCallback((type, x = window.innerWidth / 2, y = window.innerHeight / 2) => {
        const id = Date.now() + Math.random();
        setEffects(prev => [...prev, { id, type, x, y }]);
    }, []);

    const removeEffect = useCallback((id) => {
        setEffects(prev => prev.filter(effect => effect.id !== id));
    }, []);

    const particles = {
        spotCreated: (x, y) => trigger('spot-created', x, y),
        voteRelax: (x, y) => trigger('vote-relax', x, y),
        voteTombo: (x, y) => trigger('vote-tombo', x, y),
        achievement: (x, y) => trigger('achievement', x, y),
        favorite: (x, y) => trigger('favorite', x, y)
    };

    return (
        <ParticleContext.Provider value={particles}>
            {children}
            <div className="particle-container">
                {effects.map(effect => (
                    <ParticleEffect
                        key={effect.id}
                        id={effect.id}
                        type={effect.type}
                        x={effect.x}
                        y={effect.y}
                        onComplete={removeEffect}
                    />
                ))}
            </div>
        </ParticleContext.Provider>
    );
};
