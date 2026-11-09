import React, { useState, useRef, useEffect } from 'react';
import './AIChatComponent.css'; // Asumiendo que crearás este archivo CSS
import { sendMessageToAI } from '../services/AIChatService';

const AIChatComponent = ({ isOpen, onClose }) => {
    // const [isOpen, setIsOpen] = useState(false); // Controlled by parent
    const [messages, setMessages] = useState([
        { sender: 'ai', text: '¡Hola! Soy tu asistente de Peguelo. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const msgText = input;
        setInput('');
        setIsLoading(true);

        // Obtener ubicación actual
        let lat = null;
        let lon = null;

        if ("geolocation" in navigator) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                lat = position.coords.latitude;
                lon = position.coords.longitude;
            } catch (error) {
                console.log("No se pudo obtener la ubicación para el chat:", error);
            }
        }

        try {
            const responseText = await sendMessageToAI(msgText, lat, lon);
            const aiMessage = { sender: 'ai', text: responseText };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = { sender: 'ai', text: 'Lo siento, tuve un problema al procesar tu mensaje. Intenta de nuevo.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null; // Or keep it mounted and hide with CSS if you want to preserve state

    return (
        <div className={`ai-chat-container open`}>
            {/* Removed floating toggle button */}

            <div className="ai-chat-window">
                <div className="ai-chat-header">
                    <h3>Asistente Cannábico</h3>
                    <button onClick={onClose}>✖</button>
                </div>
                <div className="ai-chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender}`}>
                            <div className="message-content">{msg.text}</div>
                        </div>
                    ))}
                    {isLoading && <div className="message ai"><div className="typing-indicator">Escribiendo...</div></div>}
                    <div ref={messagesEndRef} />
                </div>
                <form className="ai-chat-input-form" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregunta algo..."
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()}>➤</button>
                </form>
            </div>
        </div>
    );
};

export default AIChatComponent;
