import React, { useEffect, useState } from 'react';
import './weed-decorations.css';

/**
 * 🍃 WEED DECORATIONS - Decoraciones temáticas de marihuana
 * 
 * Elementos visuales flotantes y efectos de humo
 * para mejorar la estética del mapa
 */

const WeedDecorations = () => {
    const [leaves, setLeaves] = useState([]);

    useEffect(() => {
        // Generate random leaves
        const generatedLeaves = Array.from({ length: 5 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 10 + Math.random() * 10,
            size: 30 + Math.random() * 30
        }));
        setLeaves(generatedLeaves);
    }, []);

    return (
        <div className="weed-decorations">
            {/* Floating leaves */}
            {leaves.map(leaf => (
                <div
                    key={leaf.id}
                    className="floating-leaf"
                    style={{
                        left: `${leaf.left}%`,
                        animationDelay: `${leaf.delay}s`,
                        animationDuration: `${leaf.duration}s`,
                        width: `${leaf.size}px`,
                        height: `${leaf.size}px`
                    }}
                >
                    🍃
                </div>
            ))}

            {/* Smoke particles (subtle) */}
            <div className="smoke-particle smoke-1"></div>
            <div className="smoke-particle smoke-2"></div>
            <div className="smoke-particle smoke-3"></div>
        </div>
    );
};

export default WeedDecorations;
