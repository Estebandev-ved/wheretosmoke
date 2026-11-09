import { createContext } from 'react';

const MensajesContext = createContext(null);

// Valor que ven los componentes sin sesión (o fuera del proveedor)
export const MENSAJES_VACIO = {
    noLeidos: 0,
    solicitudes: 0,
    total: 0,
    conectado: false,
    refrescar: () => Promise.resolve(),
    suscribir: () => () => {},
    setActiva: () => {},
};

export default MensajesContext;
