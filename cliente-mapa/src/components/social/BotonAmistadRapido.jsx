import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUserPlus, HiChatBubbleLeftEllipsis, HiClock, HiCheck } from 'react-icons/hi2';
import { enviarSolicitud, cancelarSolicitud, mensajeError } from '../../services/amigosApi';
import { useToast } from '../WeedToast';
import useMensajes from '../../hooks/useMensajes';
import useHaptics from '../../hooks/useHaptics';

/**
 * Acción rápida junto a una persona (resultados de búsqueda).
 * `onCambio(parcial)` recibe {estadoAmistad, solicitudId} para actualizar la fila.
 * Es optimista: pasa a "Enviada" al instante y revierte (con el mensaje del backend, p. ej. 403) si falla.
 */
const BotonAmistadRapido = ({ usuario, onCambio, etiqueta = 'Agregar' }) => {
    const h = useHaptics();
    const navigate = useNavigate();
    const toast = useToast();
    const { refrescar } = useMensajes();
    const [ocupado, setOcupado] = useState(false);

    const agregar = async () => {
        setOcupado(true);
        onCambio?.({ estadoAmistad: 'ENVIADA', solicitudId: null });
        try {
            const r = await enviarSolicitud(usuario.id);
            const amigos = /ACEPT|AMIG/i.test(r?.estado || '');
            onCambio?.({ estadoAmistad: amigos ? 'AMIGOS' : 'ENVIADA', solicitudId: r?.solicitudId ?? null });
            toast.success(amigos ? `Ya eres amigo de ${usuario.username}.` : `Solicitud enviada a ${usuario.username}.`);
            h.exito();
            refrescar();
        } catch (e) {
            onCambio?.({ estadoAmistad: 'NINGUNA', solicitudId: null });
            toast.error(mensajeError(e));
        } finally {
            setOcupado(false);
        }
    };

    const cancelar = async () => {
        setOcupado(true);
        onCambio?.({ estadoAmistad: 'NINGUNA', solicitudId: null });
        try {
            await cancelarSolicitud(usuario.solicitudId);
            h.tap();
            toast.success('Solicitud cancelada.');
            refrescar();
        } catch (e) {
            onCambio?.({ estadoAmistad: 'ENVIADA', solicitudId: usuario.solicitudId });
            toast.error(mensajeError(e));
        } finally {
            setOcupado(false);
        }
    };

    switch (usuario.estadoAmistad) {
        case 'NINGUNA':
            return (
                <button type="button" className="gm-btn gm-btn--primary gm-btn--sm am-quick" onClick={agregar} disabled={ocupado} aria-label={`${etiqueta} a ${usuario.username} como amigo`}>
                    <HiUserPlus size={16} aria-hidden="true" /> {etiqueta}
                </button>
            );
        case 'ENVIADA':
            return (
                <span className="am-estado am-pop">
                    <HiClock size={14} aria-hidden="true" /> Enviada
                    {usuario.solicitudId != null && (
                        <button type="button" className="am-cancelar" onClick={cancelar} disabled={ocupado} aria-label={`Cancelar la solicitud a ${usuario.username}`}>Cancelar</button>
                    )}
                </span>
            );
        case 'RECIBIDA':
            return (
                <button type="button" className="gm-btn gm-btn--sm am-quick" onClick={() => navigate(`/usuario/${usuario.id}`)} aria-label={`Responder la solicitud de ${usuario.username}`}>
                    Responder
                </button>
            );
        case 'AMIGOS':
            return (
                <button type="button" className="gm-btn gm-btn--sm am-quick" onClick={() => navigate(`/chat/${usuario.id}`)} aria-label={`Chatear con ${usuario.username}`}>
                    <HiChatBubbleLeftEllipsis size={16} aria-hidden="true" /> Mensaje
                </button>
            );
        case 'BLOQUEADO':
            return <span className="am-estado am-estado--off">Bloqueado</span>;
        case 'YO':
            return <span className="am-estado"><HiCheck size={14} aria-hidden="true" /> Tú</span>;
        default:
            return null;
    }
};

export default BotonAmistadRapido;
