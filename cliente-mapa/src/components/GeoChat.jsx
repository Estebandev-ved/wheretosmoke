import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './GeoChat.css';

const API_BASE_URL = 'http://localhost:8081/api';

export default function GeoChat({ spot, userLocation, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [canChat, setCanChat] = useState(false);
    const [distance, setDistance] = useState(null);
    const [wsConnection, setWsConnection] = useState(null);
    const messagesEndRef = useRef(null);

    // Verificar distancia al spot
    useEffect(() => {
        const checkDistance = async () => {
            if (!userLocation || !spot) return;

            try {
                const response = await axios.post(
                    `${API_BASE_URL}/chat/${spot.id}/verificar-distancia`,
                    {
                        latitud: userLocation.lat,
                        longitud: userLocation.lng
                    }
                );

                setCanChat(response.data.puedesChatear);

                // Calcular distancia aproximada
                const dist = calcularDistancia(
                    userLocation.lat, userLocation.lng,
                    spot.latitud, spot.longitud
                );
                setDistance(Math.round(dist));
            } catch (error) {
                console.error('Error verificando distancia:', error);
            }
        };

        checkDistance();
        const interval = setInterval(checkDistance, 5000); // Cada 5 segundos
        return () => clearInterval(interval);
    }, [userLocation, spot]);

    // Cargar mensajes
    const loadMessages = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/chat/${spot.id}/mensajes`);
            setMessages(response.data);
            scrollToBottom();
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        }
    };

    useEffect(() => {
        if (spot) {
            loadMessages();
        }
    }, [spot]);

    // WebSocket para mensajes en tiempo real
    useEffect(() => {
        if (!spot) return;

        const token = localStorage.getItem('token');
        const ws = new WebSocket(`ws://localhost:8081/ws?token=${token}`);

        ws.onopen = () => {
            console.log('WebSocket conectado para chat del spot:', spot.id);
            ws.send(JSON.stringify({
                type: 'subscribe',
                topic: `/topic/chat/${spot.id}`
            }));
        };

        ws.onmessage = (event) => {
            const newMsg = JSON.parse(event.data);
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
        };

        setWsConnection(ws);

        return () => {
            ws.close();
        };
    }, [spot]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !canChat || !userLocation) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/chat/${spot.id}/mensaje`,
                {
                    mensaje: newMessage,
                    latitud: userLocation.lat,
                    longitud: userLocation.lng
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            setNewMessage('');
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            alert('Error al enviar mensaje. Asegúrate de estar cerca del spot (< 50m)');
        }
    };

    if (!spot) return null;

    return (
        <div className="geochat-container">
            <div className="geochat-header">
                <div>
                    <h3>💬 Chat: {spot.nombre}</h3>
                    {distance !== null && (
                        <span className={`distance-badge ${canChat ? 'near' : 'far'}`}>
                            {distance}m {canChat ? '✓' : '✗'}
                        </span>
                    )}
                </div>
                <button className="btn-close" onClick={onClose}>✕</button>
            </div>

            {!canChat && (
                <div className="warning-banner">
                    ⚠️ Acércate al spot (menos de 50m) para chatear
                </div>
            )}

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        No hay mensajes recientes. ¡Sé el primero en escribir!
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className="message">
                            <div className="message-header">
                                <strong>{msg.username}</strong>
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString('es-CO', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className="message-content">{msg.mensaje}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="message-input">
                <input
                    type="text"
                    placeholder={canChat ? "Escribe un mensaje..." : "Acércate al spot para chatear"}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!canChat}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!canChat || !newMessage.trim()}
                    className="btn-send"
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}
