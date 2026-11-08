import { API_BASE } from '../config';
const API_URL = API_BASE;

export const sendMessageToAI = async (message, latitude = null, longitude = null) => {
    try {
        const response = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Incluir token de autenticación si está disponible (asumiendo que se guarda en localStorage)
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message, latitude, longitude }),
        });

        if (!response.ok) {
            throw new Error('Error al conectar con la IA');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error en servicio de chat:', error);
        throw error;
    }
};
