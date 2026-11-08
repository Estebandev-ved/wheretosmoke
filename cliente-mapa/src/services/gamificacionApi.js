import { API_BASE } from '../config';
import axios from 'axios';

const API = API_BASE;

// Se pasa el token de forma explícita para no depender del orden de efectos
// con AuthContext (que también lo deja en axios.defaults).
const cfg = (token) => (token ? { headers: { Authorization: `Bearer ${token}` } } : {});

/** Mensaje legible en español a partir de un error de axios. */
export const mensajeError = (e, porDefecto = 'No pudimos completar la acción. Intenta de nuevo.') => {
    if (e?.response?.data?.error) return e.response.data.error;
    if (!e?.response) return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
    return porDefecto;
};

export const getPerfil = (token) => axios.get(`${API}/gamificacion/perfil`, cfg(token)).then((r) => r.data);
export const postCheckin = (token) => axios.post(`${API}/gamificacion/checkin`, null, cfg(token)).then((r) => r.data);
export const getMisiones = (token) => axios.get(`${API}/gamificacion/misiones`, cfg(token)).then((r) => r.data);
export const postReclamar = (token, id) =>
    axios.post(`${API}/gamificacion/misiones/${id}/reclamar`, null, cfg(token)).then((r) => r.data);
export const getLeaderboard = () => axios.get(`${API}/gamificacion/leaderboard`).then((r) => r.data);
export const getBadges = () => axios.get(`${API}/gamificacion/badges`).then((r) => r.data);

export const getArticulos = (token, categoria) =>
    axios.get(`${API}/tienda/articulos`, { ...cfg(token), params: categoria ? { categoria } : undefined }).then((r) => r.data);
export const getInventario = (token) => axios.get(`${API}/tienda/inventario`, cfg(token)).then((r) => r.data);
export const postComprar = (token, id) => axios.post(`${API}/tienda/comprar/${id}`, null, cfg(token)).then((r) => r.data);
export const postEquipar = (token, id) => axios.post(`${API}/tienda/equipar/${id}`, null, cfg(token)).then((r) => r.data);
export const postDesequipar = (token, id) => axios.post(`${API}/tienda/desequipar/${id}`, null, cfg(token)).then((r) => r.data);
