import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const REFRESCO_MS = 45000;

/**
 * Para el acceso rápido "Mi círculo" del HUD: cuántos miembros (que no soy yo) están
 * compartiendo ubicación en alguno de mis círculos. Solo datos reales de /api/circulos/mis-circulos.
 * `refreshKey` fuerza una recarga (p. ej. al cerrar la hoja de círculos).
 */
export function useCirculoActividad(activo, username, refreshKey) {
    const [data, setData] = useState({ circulos: 0, compartiendo: 0 });

    useEffect(() => {
        if (!activo) return undefined;
        let cancelado = false;

        const cargar = async () => {
            const token = localStorage.getItem('token');
            if (!token || document.hidden) return;
            try {
                const res = await axios.get(`${API_BASE}/circulos/mis-circulos`, { headers: { Authorization: `Bearer ${token}` } });
                if (cancelado || !Array.isArray(res.data)) return;
                const ids = new Set();
                res.data.forEach((c) => (c.miembros || []).forEach((m) => {
                    if (m.compartiendoUbicacion && m.username !== username) ids.add(m.usuarioId);
                }));
                setData({ circulos: res.data.length, compartiendo: ids.size });
            } catch {
                /* silencioso: el acceso rápido sigue funcionando sin contador */
            }
        };

        cargar();
        const t = setInterval(cargar, REFRESCO_MS);
        return () => { cancelado = true; clearInterval(t); };
    }, [activo, username, refreshKey]);

    return activo ? data : { circulos: 0, compartiendo: 0 };
}

export default useCirculoActividad;
