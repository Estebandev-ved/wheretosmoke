import axios from 'axios';
import { API_BASE } from '../config';

const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const EMOJIS_REACCION = ['🔥', '😂', '😮', '💚', '🌿'];
export const NOMBRES_REACCION = { '🔥': 'Fuego', '😂': 'Risa', '😮': 'Asombro', '💚': 'Amor', '🌿': 'Hierba' };

export const mensajeError = (e, porDefecto) => e?.response?.data?.error || porDefecto;

export const getRankingComunas = () => axios.get(`${API_BASE}/leaderboard/comunas`).then((r) => r.data);

export const reaccionarFoto = (fotoId, emoji) =>
    axios.post(`${API_BASE}/fotos/${fotoId}/reaccion`, { emoji }, { headers: headers() }).then((r) => r.data);

export const getMetaCirculo = (id) =>
    axios.get(`${API_BASE}/circulos/${id}/meta`, { headers: headers() }).then((r) => r.data);

export const reclamarMetaCirculo = (id) =>
    axios.post(`${API_BASE}/circulos/${id}/meta/reclamar`, {}, { headers: headers() }).then((r) => r.data);
