import React, { useEffect, useState } from 'react';
import './custom-cursor.css';

/**
 * 🖱️ CUSTOM CURSOR - Cursor con hoja flotante
 * 
 * Cursor personalizado con trail de humo y efectos según contexto
 */

const CustomCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [trail, setTrail] = useState([]);
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        let trailTimeout;

        const handleMouseMove = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });

            // Add trail particle
            const newParticle = {
                id: Date.now() + Math.random(),
                x: e.clientX,
                y: e.clientY
            };

            setTrail(prev => [...prev, newParticle]);

            // Remove trail after 500ms
            setTimeout(() => {
                setTrail(prev => prev.filter(p => p.id !== newParticle.id));
            }, 500);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Hide on mobile/touch devices
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };
        checkMobile();
    }, []);

    if (isMobile) return null;

    return (
        <>
            {/* Main Cursor */}
            <div
                className={`custom-cursor ${isClicking ? 'clicking' : ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`
                }}
            >
                <span className="cursor-leaf">🍃</span>
            </div>

            {/* Smoke Trail */}
            {trail.map(particle => (
                <div
                    key={particle.id}
                    className="cursor-trail"
                    style={{
                        left: `${particle.x}px`,
                        top: `${particle.y}px`
                    }}
                >
                    💨
                </div>
            ))}
        </>
    );
};

export default CustomCursor;
