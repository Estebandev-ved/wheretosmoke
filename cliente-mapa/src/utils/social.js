/** Utilidades de la capa social (amigos / chat). */

/** Convierte {CAT: imagen} (formato del backend para otros usuarios) en props de CharacterAvatar. */
export const propsAvatar = (equipados) => {
    const e = equipados || {};
    return {
        skin: e.SKIN || undefined,
        marco: e.MARCO ? { imagen: e.MARCO } : undefined,
        mascota: e.MASCOTA ? { imagen: e.MASCOTA } : undefined,
    };
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const aFecha = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

const inicioDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "ahora", "5 min", "3 h", "ayer", "12 oct" */
export const tiempoCorto = (v) => {
    const d = aFecha(v);
    if (!d) return '';
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return 'ahora';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
    const dias = Math.round((inicioDia(new Date()) - inicioDia(d)) / 86_400_000);
    if (dias <= 0) return `${Math.floor(diff / 3_600_000)} h`;
    if (dias === 1) return 'ayer';
    if (dias < 7) return `${dias} d`;
    return `${d.getDate()} ${MESES[d.getMonth()]}`;
};

/** "14:05" */
export const horaCorta = (v) => {
    const d = aFecha(v);
    return d ? d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
};

/** Clave estable del día local (para agrupar). */
export const claveDia = (v) => {
    const d = aFecha(v);
    return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : 'x';
};

/** "Hoy", "Ayer", "12 de octubre" */
export const etiquetaDia = (v) => {
    const d = aFecha(v);
    if (!d) return '';
    const dias = Math.round((inicioDia(new Date()) - inicioDia(d)) / 86_400_000);
    if (dias <= 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
};

/** "octubre de 2026" */
export const mesAnio = (v) => {
    const d = aFecha(v);
    return d ? d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }) : '';
};
