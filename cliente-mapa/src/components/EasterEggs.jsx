import React, { useEffect, useState } from 'react';
import './easter-eggs.css';

/**
 * 🥚 EASTER EGGS - Efectos especiales ocultos
 * 
 * - Konami Code: ↑↑↓↓←→←→BA → Modo psicodélico 5s
 * - Triple-click logo: Lluvia de hojas
 * - Fecha 4/20: Tema especial
 */

const EasterEggs = () => {
    const [psychedelicMode, setPsychedelicMode] = useState(false);
    const [leafRain, setLeafRain] = useState(false);
    const [leaves, setLeaves] = useState([]);

    // Konami Code sequence
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'];
    const [konamiIndex, setKonamiIndex] = useState(0);

    // Triple-click detection
    const [clickCount, setClickCount] = useState(0);
    const [clickTimer, setClickTimer] = useState(null);

    // Konami Code Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();

            if (key === konamiCode[konamiIndex] || key === konamiCode[konamiIndex].toLowerCase()) {
                setKonamiIndex(prev => prev + 1);

                if (konamiIndex === konamiCode.length - 1) {
                    activatePsychedelicMode();
                    setKonamiIndex(0);
                }
            } else {
                setKonamiIndex(0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [konamiIndex]);

    // Psychedelic Mode
    const activatePsychedelicMode = () => {
        console.log('🌈 PSYCHEDELIC MODE ACTIVATED!');
        setPsychedelicMode(true);

        setTimeout(() => {
            setPsychedelicMode(false);
        }, 5000);
    };

    // Leaf Rain
    const activateLeafRain = () => {
        console.log('🍃 LEAF RAIN ACTIVATED!');

        // Generate 50 leaves
        const newLeaves = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 3 + Math.random() * 2,
            rotation: Math.random() * 360,
            size: 20 + Math.random() * 20
        }));

        setLeaves(newLeaves);
        setLeafRain(true);

        setTimeout(() => {
            setLeafRain(false);
            setLeaves([]);
        }, 5000);
    };

    // Triple-click handler (expose globally for logo)
    useEffect(() => {
        window.handleLogoClick = () => {
            setClickCount(prev => prev + 1);

            if (clickTimer) clearTimeout(clickTimer);

            const timer = setTimeout(() => {
                if (clickCount >= 2) {
                    activateLeafRain();
                }
                setClickCount(0);
            }, 500);

            setClickTimer(timer);
        };

        return () => {
            if (clickTimer) clearTimeout(clickTimer);
        };
    }, [clickCount]);

    // Check if it's 4/20
    useEffect(() => {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        if (month === 4 && day === 20) {
            console.log('🌿 Happy 4/20!');
            // Could add special theme here
        }
    }, []);

    return (
        <>
            {/* Psychedelic Mode Overlay */}
            {psychedelicMode && (
                <div className="psychedelic-overlay">
                    <div className="psychedelic-message">
                        🌈 PSYCHEDELIC MODE 🌈
                    </div>
                </div>
            )}

            {/* Leaf Rain */}
            {leafRain && (
                <div className="leaf-rain">
                    {leaves.map(leaf => (
                        <div
                            key={leaf.id}
                            className="rain-leaf"
                            style={{
                                left: `${leaf.left}%`,
                                animationDelay: `${leaf.delay}s`,
                                animationDuration: `${leaf.duration}s`,
                                fontSize: `${leaf.size}px`,
                                '--rotation': `${leaf.rotation}deg`
                            }}
                        >
                            🍃
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default EasterEggs;
