import axios from 'axios';
import { API_BASE } from '../config';

/**
 * API de amigos, perfiles públicos, bloqueos y mensajes directos.
 * Todo va con Bearer token (se lee de localStorage como socialApi).
 */
const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};
const get = (url, params) => axios.get(`${API_BASE}${url}`, { headers: headers(), params }).then((r) => r.data);
const post = (url, body) => axios.post(`${API_BASE}${url}`, body ?? {}, { headers: headers() }).then((r) => r.data);
const del = (url) => axios.delete(`${API_BASE}${url}`, { headers: headers() }).then((r) => r.data);

/** Mensaje legible en español a partir de un error de axios (formato {"error":"msg"}). */
export const mensajeError = (e, porDefecto = 'No pudimos completar la acción. Intenta de nuevo.') => {
    if (e?.response?.status === 429) return 'Vas muy rápido. Espera un momento e inténtalo otra vez.';
    if (e?.response?.data?.error) return e.response.data.error;
    if (!e?.response) return 'No hay conexión con el servidor. Revisa tu internet.';
    return porDefecto;
};
export const estadoHttp = (e) => e?.response?.status ?? 0;

// Búsqueda y perfil
export const buscarUsuarios = (q) => get('/usuarios/buscar', { q });
export const getPerfilPublico = (id) => get(`/usuarios/${id}/perfil`);

// Amistad
export const enviarSolicitud = (usuarioId) => post('/amigos/solicitudes', { usuarioId });
export const getSolicitudes = () => get('/amigos/solicitudes');
export const aceptarSolicitud = (id) => post(`/amigos/solicitudes/${id}/aceptar`);
export const rechazarSolicitud = (id) => post(`/amigos/solicitudes/${id}/rechazar`);
export const cancelarSolicitud = (id) => post(`/amigos/solicitudes/${id}/cancelar`);
export const getAmigos = () => get('/amigos');
export const eliminarAmigo = (usuarioId) => del(`/amigos/${usuarioId}`);

// Bloqueos
export const bloquearUsuario = (id) => post(`/usuarios/${id}/bloquear`);
export const desbloquearUsuario = (id) => del(`/usuarios/${id}/bloquear`);
export const getBloqueados = () => get('/usuarios/bloqueados');

// Mensajes
export const getConversaciones = () => get('/mensajes/conversaciones');
export const getMensajes = (usuarioId, { antes, limite = 30 } = {}) =>
    get(`/mensajes/${usuarioId}`, { antes: antes ?? undefined, limite });
export const enviarMensaje = (usuarioId, texto) => post(`/mensajes/${usuarioId}`, { texto });
export const marcarLeido = (usuarioId) => post(`/mensajes/${usuarioId}/leido`);
export const getNoLeidos = () => get('/mensajes/no-leidos');
