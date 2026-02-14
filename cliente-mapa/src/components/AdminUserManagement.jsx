import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../admin.css';

const API_BASE_URL = 'http://localhost:8081/api';

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
                <p className="admin-subtitle">Total: {users.length} usuarios</p>
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
                                <td>{user.spotsCreados || 0}</td>
                                <td>{user.puntos || 0}</td>
                                <td className="user-date">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                </td>
                                <td>
                                    <div className="action-buttons">
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
        </div>
    );
};

export default AdminUserManagement;
