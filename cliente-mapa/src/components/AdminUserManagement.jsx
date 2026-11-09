import { API_BASE } from '../config';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../admin.css';

const API_BASE_URL = API_BASE;

// Un usuario se considera "en línea" si inició sesión en los últimos 15 minutos.
const MINUTOS_EN_LINEA = 15;

const esEnLinea = (lastLogin) => {
    if (!lastLogin) return false;
    const ultimo = new Date(lastLogin).getTime();
    return Date.now() - ultimo < MINUTOS_EN_LINEA * 60 * 1000;
};

const formatearFecha = (valor) => {
    if (!valor) return '—';
    const d = new Date(valor);
    return isNaN(d) ? '—' : d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
};

const tiempoRelativo = (valor) => {
    if (!valor) return 'Nunca';
    const diffMin = Math.round((Date.now() - new Date(valor).getTime()) / 60000);
    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH} h`;
    return `Hace ${Math.round(diffH / 24)} d`;
};

const etiquetaGenero = (g) => {
    if (g === 'hombre') return 'Hombre';
    if (g === 'mujer') return 'Mujer';
    if (g === 'inclusivo' || g === 'inclusive') return 'Inclusivo';
    return g || '—';
};

/** Ficha completa de un usuario (modal). */
const FichaUsuario = ({ user, onClose, onBanToggle, onDelete }) => {
    if (!user) return null;
    const enLinea = esEnLinea(user.lastLogin);
    const campo = (label, valor) => (
        <div className="ficha-field" key={label}>
            <span>{label}</span>
            <strong>{valor ?? '—'}</strong>
        </div>
    );

    return (
        <div className="ficha-overlay" onClick={onClose}>
            <div className="ficha-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="ficha-header">
                    <h2>{user.username}</h2>
                    <button className="ficha-close" onClick={onClose} aria-label="Cerrar">×</button>
                </div>
                <div className="ficha-body">
                    <div className="ficha-section-title">Estado</div>
                    <div className="ficha-grid">
                        {campo('Conexión', enLinea ? '🟢 En línea' : `⚪ ${tiempoRelativo(user.lastLogin)}`)}
                        {campo('Cuenta', user.activo ? 'Activa' : 'Baneada / desactivada')}
                        {campo('Rol', user.role)}
                        {campo('ID', user.id)}
                    </div>

                    <div className="ficha-section-title">Datos personales</div>
                    <div className="ficha-grid">
                        {campo('Username', user.username)}
                        {campo('Email', user.email)}
                        {campo('Género', etiquetaGenero(user.genero))}
                    </div>

                    <div className="ficha-section-title">Fechas</div>
                    <div className="ficha-grid">
                        {campo('Registro', formatearFecha(user.createdAt))}
                        {campo('Último acceso', formatearFecha(user.lastLogin))}
                        {campo('Días desde el registro', user.diasActivo ?? '—')}
                    </div>

                    <div className="ficha-section-title">Actividad y gamificación</div>
                    <div className="ficha-grid">
                        {campo('Spots creados', user.spotsCreados ?? 0)}
                        {campo('Votos', user.totalVotos ?? 0)}
                        {campo('Comentarios', user.comentariosHechos ?? 0)}
                        {campo('Reportes', user.reportesHechos ?? 0)}
                        {campo('Favoritos', user.totalFavoritos ?? 0)}
                        {campo('Puntos', user.puntos ?? 0)}
                        {campo('Insignias', user.badges || '—')}
                    </div>

                    <div className="ficha-actions">
                        <button onClick={() => onBanToggle(user.id, user.activo)}>
                            {user.activo ? '🚫 Banear usuario' : '✅ Desbanear usuario'}
                        </button>
                        <button className="danger" onClick={() => onDelete(user.id, false)}>
                            🗑️ Desactivar cuenta
                        </button>
                        <button className="danger" onClick={() => onDelete(user.id, true)}>
                            💀 Eliminar permanentemente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * 👥 ADMIN USER MANAGEMENT - Gestión de usuarios
 * 
 * Permite al admin:
 * - Ver todos los usuarios con detalles
 * - Banear/desbanear usuarios
 * - Eliminar usuarios (soft y hard delete)
 * - Filtrar y buscar usuarios
 */
const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [selected, setSelected] = useState(null);
    const enLineaCount = users.filter(u => esEnLinea(u.lastLogin)).length;

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        // Aplicar filtros
        let filtered = users;

        // Filtro de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(u =>
                u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro de rol
        if (filterRole !== 'ALL') {
            filtered = filtered.filter(u => u.role === filterRole);
        }

        // Filtro de estado
        if (filterStatus === 'ACTIVE') {
            filtered = filtered.filter(u => u.activo);
        } else if (filterStatus === 'BANNED') {
            filtered = filtered.filter(u => !u.activo);
        }

        setFilteredUsers(filtered);
    }, [searchTerm, filterRole, filterStatus, users]);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(response.data);
            setFilteredUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
            setLoading(false);
        }
    };

    const handleBanToggle = async (userId, currentStatus) => {
        if (!confirm(`¿${currentStatus ? 'Desbanear' : 'Banear'} este usuario?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/admin/users/${userId}/ban`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchUsers(); // Recargar lista
            alert(`Usuario ${currentStatus ? 'desbaneado' : 'baneado'} exitosamente`);
        } catch (err) {
            alert('Error al cambiar estado del usuario');
        }
    };

    const handleDeleteUser = async (userId, hardDelete = false) => {
        const confirmMsg = hardDelete
            ? '⚠️ ELIMINAR PERMANENTEMENTE al usuario y TODOS sus datos?\n\nEsta acción NO SE PUEDE DESHACER.'
            : '¿Desactivar la cuenta de este usuario?';

        if (!confirm(confirmMsg)) return;

        try {
            const token = localStorage.getItem('token');
            const endpoint = hardDelete
                ? `${API_BASE_URL}/admin/users/${userId}/hard`
                : `${API_BASE_URL}/admin/users/${userId}`;

            await axios.delete(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchUsers();
            alert(`Usuario ${hardDelete ? 'eliminado permanentemente' : 'desactivado'}`);
        } catch (err) {
            alert('Error al eliminar usuario');
        }
    };

    if (loading) {
        return <div className="admin-loading">⏳ Cargando usuarios...</div>;
    }

    return (
        <div className="admin-user-management">
            <div className="admin-header">
                <h1>👥 Gestión de Usuarios</h1>
                <p className="admin-subtitle">
                    Total: {users.length} usuarios · <span className="presence online"><span className="presence-dot" />{enLineaCount} en línea ahora</span>
                </p>
            </div>

            {/* FILTROS Y BÚSQUEDA */}
            <div className="admin-filters">
                <input
                    type="text"
                    placeholder="🔍 Buscar por username o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
                    <option value="ALL">Todos los roles</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                    <option value="ALL">Todos los estados</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="BANNED">Baneados</option>
                </select>
            </div>

            {/* TABLA DE USUARIOS */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Avatar</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Conexión</th>
                            <th>Spots</th>
                            <th>Puntos</th>
                            <th>Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={!user.activo ? 'user-banned' : ''}>
                                <td>{user.id}</td>
                                <td>
                                    <div className="user-avatar">
                                        {user.genero === 'hombre' ? '👨' : user.genero === 'mujer' ? '👩' : '🧑'}
                                    </div>
                                </td>
                                <td className="user-username">{user.username}</td>
                                <td className="user-email">{user.email}</td>
                                <td>
                                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${user.activo ? 'active' : 'banned'}`}>
                                        {user.activo ? '✅ Activo' : '🚫 Baneado'}
                                    </span>
                                </td>
                                <td>
                                    {esEnLinea(user.lastLogin) ? (
                                        <span className="presence online"><span className="presence-dot" />En línea</span>
                                    ) : (
                                        <span className="presence" title={formatearFecha(user.lastLogin)}>
                                            <span className="presence-dot" />{tiempoRelativo(user.lastLogin)}
                                        </span>
                                    )}
                                </td>
                                <td>{user.spotsCreados || 0}</td>
                                <td>{user.puntos || 0}</td>
                                <td className="user-date">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-small btn-view" onClick={() => setSelected(user)}>
                                            Ver ficha
                                        </button>
                                        <button
                                            className={`btn-small ${user.activo ? 'btn-ban' : 'btn-unban'}`}
                                            onClick={() => handleBanToggle(user.id, user.activo)}
                                            title={user.activo ? 'Banear usuario' : 'Desbanear usuario'}
                                        >
                                            {user.activo ? '🚫' : '✅'}
                                        </button>
                                        <button
                                            className="btn-small btn-delete"
                                            onClick={() => handleDeleteUser(user.id, false)}
                                            title="Desactivar usuario"
                                        >
                                            🗑️
                                        </button>
                                        <button
                                            className="btn-small btn-hard-delete"
                                            onClick={() => handleDeleteUser(user.id, true)}
                                            title="ELIMINAR PERMANENTEMENTE"
                                        >
                                            💀
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                <div className="no-results">
                    No se encontraron usuarios con los filtros aplicados
                </div>
            )}

            <FichaUsuario
                user={selected}
                onClose={() => setSelected(null)}
                onBanToggle={(id, activo) => { setSelected(null); handleBanToggle(id, activo); }}
                onDelete={(id, hard) => { setSelected(null); handleDeleteUser(id, hard); }}
            />
        </div>
    );
};

export default AdminUserManagement;
