import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

/**
 * 🔐 CONTEXTO DE AUTENTICACIÓN
 * 
 * Provee estado de autenticación a toda la app:
 * - user: datos del usuario logueado
 * - token: JWT para peticiones autenticadas
 * - login/register/logout: funciones de auth
 */

const AuthContext = createContext(null);

// Hook personalizado para usar el contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:8081/api/auth';

    // 📝 Configurar axios para incluir el token en todas las peticiones
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // ✅ Verificar token al cargar la app
    useEffect(() => {
        const verificarToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/verify`);
                if (response.data.username) {
                    setUser({
                        username: response.data.username,
                        email: response.data.email,
                        role: response.data.role,
                        genero: response.data.genero
                    });
                } else {
                    // Token inválido
                    logout();
                }
            } catch (error) {
                console.log('Error verificando token, decodificando localmente...');
                // Fallback: decodificar el JWT directamente
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setUser({
                        username: payload.sub,
                        email: payload.sub, // Asumimos que sub es el email
                        role: payload.role.replace('ROLE_', ''), // Quitar prefijo ROLE_
                        genero: payload.genero || 'hombre'
                    });
                    console.log('✅ Usuario cargado desde JWT:', payload);
                } catch (decodeError) {
                    console.log('Token inválido o expirado');
                    logout();
                }
            }
            setLoading(false);
        };

        verificarToken();
    }, []);

    /**
     * 📝 REGISTRAR NUEVO USUARIO
     */
    const register = async (username, email, password, genero) => {
        try {
            const response = await axios.post(`${API_URL}/register`, {
                username,
                email,
                password,
                genero
            });

            if (response.data.token) {
                setToken(response.data.token);
                localStorage.setItem('token', response.data.token);
                setUser({
                    username: response.data.username,
                    email: response.data.email,
                    role: response.data.role,
                    genero: response.data.genero
                });
                return { success: true, message: response.data.message };
            }

            return { success: false, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Error de conexión'
            };
        }
    };

    /**
     * 🔑 LOGIN
     */
    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, {
                email,
                password
            });

            if (response.data.token) {
                setToken(response.data.token);
                localStorage.setItem('token', response.data.token);
                setUser({
                    username: response.data.username,
                    email: response.data.email,
                    role: response.data.role,
                    genero: response.data.genero
                });
                return { success: true, message: response.data.message };
            }

            return { success: false, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Error de conexión'
            };
        }
    };

    /**
     * 🚪 LOGOUT
     */
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    /**
     * 👑 Verificar si es admin
     */
    const isAdmin = () => {
        return user?.role === 'ADMIN';
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
