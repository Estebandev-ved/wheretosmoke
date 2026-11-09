import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import AdminUserManagement from './AdminUserManagement';
import AdminSpotManagement from './AdminSpotManagement';
import AdminGeoZones from './AdminGeoZones';
import MapComponent from '../MapComponent';
import '../admin.css';
import '../admin-pro.css'; // Tema corporativo (sobrescribe admin.css)

/**
 * 🔒 ADMIN PANEL - Panel de administración principal
 * 
 * Contenedor principal con navegación entre secciones:
 * - Dashboard (estadísticas)
 * - User Management (gestión de usuarios)
 * - Spot Management (gestión de spots)
 */
const AdminPanel = ({ darkMode = true, setDarkMode = () => {} }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleBackToMap = () => {
        navigate('/');
    };

    // Verificar que el usuario es admin
    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="admin-unauthorized">
                <h1>🚫 Acceso Denegado</h1>
                <p>Solo los administradores pueden acceder a este panel</p>
                <button onClick={handleBackToMap}>Volver al Mapa</button>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            {/* SIDEBAR */}
            <div className="admin-sidebar">
                <div className="admin-logo">
                    <h2>🔥 Admin Panel</h2>
                    <p className="admin-user">👑 {user.username}</p>
                </div>

                <nav className="admin-nav">
                    <button
                        className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 Dashboard
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 Usuarios
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'mapa' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mapa')}
                    >
                        🗺️ Mapa en vivo
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'spots' ? 'active' : ''}`}
                        onClick={() => setActiveTab('spots')}
                    >
                        📍 Spots
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'geozonas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('geozonas')}
                    >
                        🗺️ Geo-Zonas
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="btn-back" onClick={handleBackToMap}>
                        🗺️ Volver al Mapa
                    </button>
                    <button className="btn-logout" onClick={handleLogout}>
                        🚪 Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="admin-content">
                {activeTab === 'dashboard' && <AdminDashboard />}
                {activeTab === 'mapa' && (
                    <div className="admin-map-wrap">
                        <MapComponent darkMode={darkMode} setDarkMode={setDarkMode} />
                    </div>
                )}
                {activeTab === 'users' && <AdminUserManagement />}
                {activeTab === 'spots' && <AdminSpotManagement />}
                {activeTab === 'geozonas' && <AdminGeoZones />}
            </div>
        </div>
    );
};

export default AdminPanel;
