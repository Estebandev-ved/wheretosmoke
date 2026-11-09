import { useContext } from 'react';
import MensajesContext, { MENSAJES_VACIO } from '../context/mensajesStore';

/**
 * Estado global de mensajes y solicitudes.
 *   noLeidos     mensajes directos sin leer
 *   solicitudes  solicitudes de amistad recibidas pendientes
 *   total        noLeidos + solicitudes (para avisos generales)
 *   conectado    true si el socket STOMP está vivo
 *   refrescar()  vuelve a consultar los contadores
 *   suscribir(fn) fn(evento) con cada mensaje nuevo ({...dto}) o {tipo:'leido',deId}; devuelve la baja
 *   setActiva(id) marca la conversación abierta (no genera toast ni suma no leídos)
 */
export const useMensajes = () => useContext(MensajesContext) || MENSAJES_VACIO;

export default useMensajes;
