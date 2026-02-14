import React, { useState, useEffect } from 'react';
import rainbowGuy from '../assets/characters/rainbow_guy.png';
import hippieGuy from '../assets/characters/hippie_guy.png';
import './onboarding.css';

/**
 * 🌿 ONBOARDING TUTORIAL - Tutorial interactivo con personajes
 * 
 * Tutorial de bienvenida temático con personajes rastafari
 * que explican la aplicación mediante diálogos animados.
 */

const dialogues = [
    {
        id: 1,
        character: 'rainbow',
        name: 'Bob',
        image: rainbowGuy,
        position: 'left',
        text: '¡Ey parcero! 👋 Bienvenido a WhereToSmoke',
        subtext: 'Aquí encontrás los mejores spots para fumar tranquilo 🌿'
    },
    {
        id: 2,
        character: 'hippie',
        name: 'Marley',
        image: hippieGuy,
        position: 'right',
        text: '¡Súper fácil parce! 🗺️',
        subtext: 'Buscá spots en el mapa o creá uno nuevo donde te encuentres'
    },
    {
        id: 3,
        character: 'rainbow',
        name: 'Bob',
        image: rainbowGuy,
        position: 'left',
        text: 'Votá cada spot: 🚨 TOMBO o 🥦 RELAX',
        subtext: 'Así sabemos cuáles están seguros y cuáles están calientes'
    },
    {
        id: 4,
        character: 'hippie',
        name: 'Marley',
        image: hippieGuy,
        position: 'right',
        text: 'Comentá, subí fotos, hacé amigos ✌️',
        subtext: 'Entre todos hacemos la comunidad más grande y segura'
    },
    {
        id: 5,
        character: 'both',
        name: 'Bob & Marley',
        image: null,
        position: 'center',
        text: '¡Ahora sí, a explorar! 🔥',
        subtext: 'Fumá responsable y cuidá el ambiente 🌱'
    }
];

const OnboardingTutorial = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has seen the tutorial
        const hasSeenTutorial = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenTutorial) {
            setTimeout(() => setIsVisible(true), 500);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < dialogues.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setIsVisible(false);
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 300);
    };

    if (!isVisible) return null;

    const currentDialogue = dialogues[currentStep];
    const progress = ((currentStep + 1) / dialogues.length) * 100;

    return (
        <div className={`onboarding-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="onboarding-container">
                {/* Progress bar */}
                <div className="onboarding-progress">
                    <div
                        className="onboarding-progress-bar"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Character(s) */}
                <div className="onboarding-characters">
                    {currentDialogue.character === 'both' ? (
                        <>
                            <img
                                src={rainbowGuy}
                                alt="Bob"
                                className="character character-left both"
                            />
                            <img
                                src={hippieGuy}
                                alt="Marley"
                                className="character character-right both"
                            />
                        </>
                    ) : (
                        <img
                            src={currentDialogue.image}
                            alt={currentDialogue.name}
                            className={`character character-${currentDialogue.position} active`}
                        />
                    )}
                </div>

                {/* Dialogue box */}
                <div className="onboarding-dialogue">
                    <div className="dialogue-name">{currentDialogue.name}</div>
                    <h2 className="dialogue-text">{currentDialogue.text}</h2>
                    <p className="dialogue-subtext">{currentDialogue.subtext}</p>

                    {/* Dots indicator */}
                    <div className="onboarding-dots">
                        {dialogues.map((_, index) => (
                            <span
                                key={index}
                                className={`dot ${index === currentStep ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="onboarding-actions">
                    <button
                        className="onboarding-btn skip"
                        onClick={handleSkip}
                    >
                        Omitir
                    </button>
                    <button
                        className="onboarding-btn next"
                        onClick={handleNext}
                    >
                        {currentStep === dialogues.length - 1 ? '¡Listo! 🚀' : 'Siguiente'}
                    </button>
                </div>

                {/* Smoke effect */}
                <div className="smoke-effect"></div>
                <div className="smoke-effect delay"></div>
            </div>
        </div>
    );
};

export default OnboardingTutorial;
