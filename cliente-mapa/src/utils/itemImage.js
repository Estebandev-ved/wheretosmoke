// Resuelve la imagen de un artículo: puede venir como ruta pública (/icons/...)
// o como ruta de assets de Vite (src/assets/characters/...).
const assets = import.meta.glob('../assets/characters/*.png', { eager: true, import: 'default' });

export const resolveItemImage = (imagen) => {
    if (!imagen) return '/icons/bud_map.png';
    if (imagen.startsWith('/') || imagen.startsWith('http')) return imagen;
    const nombre = imagen.split('/').pop();
    const clave = Object.keys(assets).find((k) => k.endsWith(`/${nombre}`));
    return clave ? assets[clave] : '/icons/bud_map.png';
};

export const RAREZAS = {
    COMUN: { label: 'Común', clase: 'comun' },
    RARO: { label: 'Raro', clase: 'raro' },
    EPICO: { label: 'Épico', clase: 'epico' },
    LEGENDARIO: { label: 'Legendario', clase: 'legendario' },
};
export const ORDEN_RAREZA = ['LEGENDARIO', 'EPICO', 'RARO', 'COMUN'];
export const CATEGORIAS = [
    { id: 'SKIN', label: 'Skins', singular: 'Skin' },
    { id: 'MARCO', label: 'Marcos', singular: 'Marco' },
    { id: 'MASCOTA', label: 'Mascotas', singular: 'Mascota' },
    { id: 'PIN', label: 'Pines', singular: 'Pin' },
    { id: 'EFECTO', label: 'Efectos', singular: 'Efecto' },
];

// Avatar por defecto: los PNG de /icons/Hombre|Mujer|Inclusive son solo ojos (arte del
// selector de género), no personajes completos, así que todos usan el cogollo de la app.
export const AVATAR_POR_DEFECTO = '/icons/bud_smoking.png';
// eslint-disable-next-line no-unused-vars
export const avatarPorGenero = (_genero) => AVATAR_POR_DEFECTO;
