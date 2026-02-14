import React from 'react';
import './page-transitions.css';

/**
 * ✨ PAGE TRANSITION - Wrapper para transiciones de página
 * 
 * Añade animaciones suaves al montar/desmontar componentes
 * Fade + Scale para un efecto premium
 */

const PageTransition = ({ children, className = '' }) => {
    return (
        <div className={`page-transition ${className}`}>
            {children}
        </div>
    );
};

export default PageTransition;
