import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

const PushNotificationButton = () => {
    const { isSubscribed, loading, permission, subscribeToPush } = usePushNotifications();

    if (permission === 'denied') {
        return (
            <div style={{ fontSize: '12px', color: '#ff4444', marginTop: '10px' }}>
                🔕 Notificaciones bloqueadas en navegador
            </div>
        );
    }

    if (isSubscribed) {
        return (
            <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: 'rgba(0, 200, 81, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(0, 200, 81, 0.3)',
                fontSize: '13px',
                color: '#00C851',
                textAlign: 'center'
            }}>
                🔔 Notificaciones activas
            </div>
        );
    }

    return (
        <button
            onClick={subscribeToPush}
            disabled={loading}
            style={{
                marginTop: '15px',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #FF8800 0%, #ffbb33 100%)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 136, 0, 0.3)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
            }}
        >
            {loading ? 'Activando...' : '🔔 Activar Alertas'}
        </button>
    );
};

export default PushNotificationButton;
