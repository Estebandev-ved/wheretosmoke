import React, { useEffect, useState } from 'react';
import { useGlobalSound } from '../context/SoundContext';
import './achievement-unlocked.css';

/**
 * 🏆 ACHIEVEMENT UNLOCKED - Animación épica de desbloqueo
 * 
 * Muestra animación de rotura de insignia anterior
 * y aparición de nueva insignia con aura dorada
 */

const AchievementUnlocked = ({ achievement, previousAchievement, onClose }) => {
    const [phase, setPhase] = useState('enter'); // enter, shatter, appear, confetti, exit
    const { sounds } = useGlobalSound();

    useEffect(() => {
        // Play level up sound
        sounds.levelUp();

        // Animation sequence - SLOWER for better viewing
        const sequence = async () => {
            // 1. Enter (800ms - más tiempo para cargar)
            await delay(800);

            if (previousAchievement) {
                // 2. Shatter old badge (1200ms - más lento)
                setPhase('shatter');
                await delay(1200);
            }

            // 3. Appear new badge (1500ms - más tiempo para apreciar)
            setPhase('appear');
            sounds.achievement();
            await delay(1500);

            // 4. Confetti (2500ms - animación más larga)
            setPhase('confetti');
            await delay(2500);

            // NO auto-close, espera click del usuario
        };

        sequence();
    }, []);

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleClose = () => {
        setPhase('exit');
        setTimeout(onClose, 400); // Dar más tiempo a la animación de salida
    };

    const getTierColor = (tier) => {
        switch (tier) {
            case 'bronze': return '#cd7f32';
            case 'silver': return '#c0c0c0';
            case 'gold': return '#ffd700';
            default: return '#ffd700';
        }
    };

    return (
        <div className={`achievement-overlay ${phase}`}>
            <div className="achievement-modal">

                {/* Previous Badge (Shattering) */}
                {previousAchievement && phase === 'shatter' && (
                    <div className="achievement-old">
                        <div className="badge-shatter">
                            <span className="badge-icon">{previousAchievement.icon}</span>

                            {/* Shatter fragments */}
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={`fragment fragment-${i}`}></div>
                            ))}
                        </div>
                    </div>
                )}

                {/* New Badge (Appearing with Aura) */}
                {(phase === 'appear' || phase === 'confetti') && (
                    <div className="achievement-new">
                        {/* Golden Aura */}
                        <div
                            className="golden-aura"
                            style={{ '--tier-color': getTierColor(achievement.tier) }}
                        ></div>

                        {/* Light Rays */}
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="light-ray"
                                style={{ '--angle': `${i * 45}deg` }}
                            ></div>
                        ))}

                        {/* Badge */}
                        <div
                            className="badge-new"
                            style={{ '--tier-color': getTierColor(achievement.tier) }}
                        >
                            <span className="badge-icon-new">{achievement.icon}</span>
                        </div>

                        {/* Sparkles */}
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="sparkle"
                                style={{
                                    '--delay': `${Math.random() * 0.5}s`,
                                    '--angle': `${Math.random() * 360}deg`,
                                    '--distance': `${80 + Math.random() * 60}px`
                                }}
                            >
                                ✨
                            </div>
                        ))}

                        {/* Text */}
                        <div className="achievement-text">
                            <h2 className="achievement-title">¡Nuevo Logro Desbloqueado!</h2>
                            <h3 className="achievement-name">{achievement.name}</h3>
                            <p className="achievement-desc">{achievement.description}</p>
                        </div>

                        {/* Button */}
                        <button className="achievement-btn" onClick={handleClose}>
                            ¡Genial! 🎉
                        </button>
                    </div>
                )}

                {/* Confetti */}
                {phase === 'confetti' && (
                    <div className="confetti-container">
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={i}
                                className="confetti"
                                style={{
                                    '--x': `${Math.random() * 100}%`,
                                    '--delay': `${Math.random() * 0.5}s`,
                                    '--rotate': `${Math.random() * 360}deg`,
                                    '--color': ['#ffd700', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)]
                                }}
                            ></div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AchievementUnlocked;
