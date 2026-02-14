import React from 'react';
import '../admin.css';

/**
 * 💎 CONFIRM DIALOG - Diálogo de confirmación premium
 * 
 * Reemplaza los feos confirm() y alert() del navegador
 * con un modal estilo glassmorphic
 */
const ConfirmDialog = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning' // warning, danger, success, info
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return '🗑️';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            default: return '⚠️';
        }
    };

    const handleConfirm = () => {
        onConfirm();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
    };

    return (
        <div className="confirm-dialog-overlay" onClick={handleCancel}>
            <div className={`confirm-dialog ${type}`} onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon">{getIcon()}</div>
                <h2 className="confirm-title">{title}</h2>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    {onCancel && (
                        <button
                            className="confirm-btn cancel"
                            onClick={handleCancel}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        className="confirm-btn confirm"
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
