import React from 'react';
import './animated-background.css';

/**
 * 🌌 ANIMATED BACKGROUND - Fondo animado sutil
 * 
 * Gradiente cambiante y orbes flotantes para ambiente premium
 * Se adapta a modo claro/oscuro
 */

const AnimatedBackground = ({ darkMode = false }) => {
    return (
        <div className={`animated-background ${darkMode ? 'dark' : 'light'}`}>
            {/* Gradient Background */}
            <div className="gradient-layer"></div>

            {/* Floating Orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="orb orb-4"></div>
        </div >
    );
};

export default AnimatedBackground;
