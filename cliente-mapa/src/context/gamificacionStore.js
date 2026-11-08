import { createContext } from 'react';

const GamificacionContext = createContext(null);

// Estado que ven los componentes cuando no hay sesión
export const ESTADO_INVITADO = {
    esInvitado: true,
    nivel: 1,
    tituloRango: 'Invitado',
    xp: 0,
    xpNivelActual: 0,
    xpSiguienteNivel: 100,
    monedas: 0,
    rachaDias: 0,
    checkinHoy: false,
    equipados: {},
    equipadosItems: {},
    inventario: [],
    perfil: null,
};

export default GamificacionContext;
