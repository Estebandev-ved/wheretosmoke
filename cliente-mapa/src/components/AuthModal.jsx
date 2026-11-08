import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

/**
 * 🔐 MODAL DE LOGIN/REGISTRO
 * 
 * Formulario con dos tabs para login y registro.
 */
const AuthModal = ({ isOpen, onClose, darkMode }) => {
    const [activeTab, setActiveTab] = useState('login'); // 'login' o 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [genero, setGenero] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let result;

            if (activeTab === 'login') {
                result = await login(email, password);
            } else {
                if (!username.trim()) {
                    toast.warning('Ingresa un nombre de usuario');
                    setLoading(false);
                    return;
                }
                result = await register(username, email, password, genero);
            }

            if (result.success) {
                toast.success(result.message);
                onClose();
                // Limpiar campos
                setEmail('');
                setPassword('');
                setUsername('');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error de conexión');
        }

        setLoading(false);
    };

    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        },
        modal: {
            backgroundColor: darkMode ? 'var(--surface)' : 'white',
            color: darkMode ? 'var(--text)' : '#333',
            border: darkMode ? '1px solid var(--border-subtle)' : 'none',
            fontFamily: 'var(--font-body)',
            borderRadius: '16px',
            padding: '25px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        },
        tabs: {
            display: 'flex',
            borderBottom: `2px solid ${darkMode ? '#444' : '#eee'}`,
            marginBottom: '20px'
        },
        tab: (active) => ({
            flex: 1,
            padding: '10px',
            textAlign: 'center',
            cursor: 'pointer',
            borderBottom: active ? '3px solid var(--accent)' : 'none',
            color: active ? 'var(--accent)' : (darkMode ? '#888' : '#666'),
            fontWeight: active ? 'bold' : 'normal',
            transition: 'all 0.2s'
        }),
        input: {
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '12px',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.16)' : '#ddd'}`,
            backgroundColor: darkMode ? 'var(--surface-2)' : 'white',
            color: darkMode ? 'white' : '#333',
            fontSize: '14px',
            boxSizing: 'border-box'
        },
        button: {
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: 'var(--accent)',
            color: '#04130A',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: loading ? 0.7 : 1
        },
        closeBtn: {
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: darkMode ? '#888' : '#666'
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={{ ...modalStyles.modal, position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button style={modalStyles.closeBtn} onClick={onClose} aria-label="Cerrar">×</button>

                <h2 style={{ marginTop: 0, textAlign: 'center' }}>
                    {activeTab === 'login' ? '🔑 Iniciar Sesión' : '📝 Registrarse'}
                </h2>

                {/* TABS */}
                <div style={modalStyles.tabs}>
                    <div
                        style={modalStyles.tab(activeTab === 'login')}
                        onClick={() => setActiveTab('login')}
                    >
                        Login
                    </div>
                    <div
                        style={modalStyles.tab(activeTab === 'register')}
                        onClick={() => setActiveTab('register')}
                    >
                        Registro
                    </div>
                </div>

                {/* FORMULARIO */}
                <form onSubmit={handleSubmit}>
                    {activeTab === 'register' && (
                        <input
                            type="text"
                            placeholder="Nombre de usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={modalStyles.input}
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={modalStyles.input}
                        required
                    />

                    <select
                        value={genero}
                        onChange={(e) => setGenero(e.target.value)}
                        style={modalStyles.input}
                        required
                    >
                        <option value="" disabled>¿Cómo te identificas?</option>
                        <option value="hombre">Parcero 👨</option>
                        <option value="mujer">Parcera 👩</option>
                        <option value="inclusive">Parcere / Inclusive 🌈</option>
                    </select>

                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={modalStyles.input}
                        required
                        minLength={6}
                    />

                    <button type="submit" style={modalStyles.button} disabled={loading}>
                        {loading ? '...' : (activeTab === 'login' ? 'Entrar' : 'Crear Cuenta')}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '12px', color: darkMode ? '#888' : '#999', marginTop: '15px' }}>
                    {activeTab === 'login'
                        ? '¿No tienes cuenta? Haz clic en Registro'
                        : 'La contraseña debe tener mínimo 6 caracteres'}
                </p>
            </div>
        </div>
    );
};

export default AuthModal;
