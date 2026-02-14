import React, { createContext, useContext, useState, useCallback } from 'react';
import './weed-toast.css';

/**
 * 🔔 WEED TOAST - Sistema de notificaciones custom
 * 
 * Notificaciones temáticas con iconos de hojas y animaciones de humo
 * Reemplazo premium de react-toastify
 */

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

const Toast = ({ id, type, message, onClose }) => {
    const icons = {
        success: '🍃',
        error: '🍃',
        info: '🍃',
        warning: '🍃'
    };

    const symbols = {
        success: '✓',
        error: '✗',
        info: 'ℹ',
        warning: '⚠'
    };

    return (
        <div className={`weed-toast weed-toast-${type}`}>
            <div className="toast-icon-wrapper">
                <span className="toast-leaf">{icons[type]}</span>
                <span className="toast-symbol">{symbols[type]}</span>
            </div>

            <div className="toast-content">
                <p className="toast-message">{message}</p>
            </div>

            <button className="toast-close" onClick={() => onClose(id)}>
                ✕
            </button>

            <div className="toast-progress-bar"></div>

            {/* Smoke effect */}
            <div className="toast-smoke smoke-1"></div>
            <div className="toast-smoke smoke-2"></div>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();

        setToasts(prev => [...prev, { id, type, message }]);

        // Auto-remove after duration
        setTimeout(() => {
            removeToast(id);
        }, duration);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        info: (message, duration) => addToast(message, 'info', duration),
        warning: (message, duration) => addToast(message, 'warning', duration)
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="weed-toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        type={toast.type}
                        message={toast.message}
                        onClose={removeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
