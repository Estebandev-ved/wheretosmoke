// Configuración central de la URL del backend.
//
// Por defecto las peticiones son RELATIVAS (`/api/...`, `/ws`):
//  - En desarrollo, Vite las reenvía al backend (ver `server.proxy` en vite.config.js).
//  - En producción, un proxy inverso (nginx, etc.) debe servir /api y /ws en el mismo dominio.
// Si el backend vive en otro dominio, define VITE_API_ORIGIN (p. ej. https://api.midominio.com)
// y habilita ese origen en el backend con CORS_ORIGINS.
export const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/$/, '');

export const API_BASE = `${API_ORIGIN}/api`;
export const WS_URL = `${API_ORIGIN}/ws`;
