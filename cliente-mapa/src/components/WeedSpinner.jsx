import React from 'react';
import './weed-spinner.css';

/**
 * 🍃 WEED SPINNER - Loading spinner temático
 * 
 * Spinner de carga con hoja de marihuana girando
 * y efecto 3D premium
 */

const WeedSpinner = ({ size = 'medium', text = 'Cargando...' }) => {
    const sizes = {
        small: '40px',
        medium: '80px',
        large: '120px'
    };

    return (
        <div className="weed-spinner-container">
            <div
                className="weed-spinner"
                style={{
                    width: sizes[size],
                    height: sizes[size]
                }}
            >
                <div className="leaf-wrapper">
                    <svg viewBox="0 0 100 100" className="spinning-leaf">
                        {/* Main leaf shape */}
                        <g className="leaf">
                            {/* Center */}
                            <ellipse cx="50" cy="50" rx="8" ry="20" fill="#10b981" />

                            {/* Left leaves */}
                            <ellipse cx="35" cy="45" rx="6" ry="15" fill="#059669" transform="rotate(-30 35 45)" />
                            <ellipse cx="30" cy="50" rx="5" ry="12" fill="#047857" transform="rotate(-45 30 50)" />

                            {/* Right leaves */}
                            <ellipse cx="65" cy="45" rx="6" ry="15" fill="#34d399" transform="rotate(30 65 45)" />
                            <ellipse cx="70" cy="50" rx="5" ry="12" fill="#6ee7b7" transform="rotate(45 70 50)" />

                            {/* Top leaves */}
                            <ellipse cx="45" cy="35" rx="5" ry="12" fill="#10b981" transform="rotate(-20 45 35)" />
                            <ellipse cx="55" cy="35" rx="5" ry="12" fill="#34d399" transform="rotate(20 55 35)" />

                            {/* Bottom leaves */}
                            <ellipse cx="45" cy="65" rx="5" ry="12" fill="#059669" transform="rotate(-20 45 65)" />
                            <ellipse cx="55" cy="65" rx="5" ry="12" fill="#10b981" transform="rotate(20 55 65)" />

                            {/* Stem */}
                            <rect x="49" y="50" width="2" height="25" fill="#047857" rx="1" />

                            {/* Highlights */}
                            <ellipse cx="50" cy="45" rx="3" ry="8" fill="#a7f3d0" opacity="0.6" />
                        </g>
                    </svg>

                    {/* Smoke particles */}
                    <div className="smoke smoke-1"></div>
                    <div className="smoke smoke-2"></div>
                    <div className="smoke smoke-3"></div>
                </div>
            </div>

            {text && <p className="spinner-text">{text}</p>}
        </div>
    );
};

export default WeedSpinner;
