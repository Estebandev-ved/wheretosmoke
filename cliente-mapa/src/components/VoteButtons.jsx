import React from 'react';
import './vote-buttons.css';

/**
 * 🗳️ VOTE BUTTONS - Botones de votación premium
 * 
 * Botones mejorados para votar TOMBO o RELAX en spots
 * con animaciones, iconos y efectos visuales
 */

const VoteButtons = ({
    onTomboClick,
    onRelaxClick,
    disabled = false,
    votosTombo = 0,
    votosRelax = 0,
    size = 'medium'
}) => {
    return (
        <div className={`vote-buttons-container ${size}`}>
            {/* TOMBO Button */}
            <button
                className={`vote-btn tombo ${disabled ? 'disabled' : ''}`}
                onClick={onTomboClick}
                disabled={disabled}
            >
                <div className="vote-icon tombo-icon">
                    {!disabled && <div className="siren-light"></div>}
                    🚨
                </div>
                <div className="vote-label">
                    <span className="vote-text">TOMBO</span>
                    <span className="vote-count">{votosTombo}/3</span>
                </div>
                {disabled && <div className="checkmark">✓</div>}
            </button>

            {/* RELAX Button */}
            <button
                className={`vote-btn relax ${disabled ? 'disabled' : ''}`}
                onClick={onRelaxClick}
                disabled={disabled}
            >
                <div className="vote-icon relax-icon">
                    {!disabled && (
                        <>
                            <div className="glow-effect"></div>
                            <div className="sparkle sparkle-1">✨</div>
                            <div className="sparkle sparkle-2">✨</div>
                        </>
                    )}
                    🥦
                </div>
                <div className="vote-label">
                    <span className="vote-text">RELAX</span>
                    <span className="vote-count">{votosRelax}/3</span>
                </div>
                {disabled && <div className="checkmark">✓</div>}
            </button>
        </div>
    );
};

export default VoteButtons;
