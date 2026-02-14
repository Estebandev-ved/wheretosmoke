import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PUBLIC_VAPID_KEY = 'BDMU1F5tHnAsmpsZM9bJs5j4B69KqowsCFjz6qzFMPb5fuQWJ_hly78StwfTp9dqcBKA2ludxbFN-X93eogZEpY';

export const usePushNotifications = () => {
    const { user } = useAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        checkSubscription();
    }, []);

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setPermission(Notification.permission);
    };

    const subscribeToPush = async () => {
        if (!user) {
            toast.warning('Debes iniciar sesión para recibir alertas');
            return;
        }

        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;

            // 1. Obtener suscripción de push manager
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            // 2. Enviar suscripción al backend
            console.log('Sending subscription to backend:', subscription);
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/push/subscribe?userId=${user.username || 'anon'}`, subscription);

            setIsSubscribed(true);
            setPermission('granted');
            toast.success('🔔 ¡Notificaciones activadas!');
        } catch (error) {
            console.error('Error suscribiendo a push:', error);
            toast.error('No se pudieron activar las notificaciones');
        }
        setLoading(false);
    };

    return {
        isSubscribed,
        loading,
        permission,
        subscribeToPush
    };
};
