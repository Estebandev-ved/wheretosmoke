import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUserPlus, HiChatBubbleLeftEllipsis, HiClock, HiCheck } from 'react-icons/hi2';
import { enviarSolicitud, mensajeError } from '../../services/amigosApi';
import { useToast } from '../WeedToast';
import useMensajes from '../../hooks/useMensajes';

/**
 * Acción rápida junto a una persona (resultados de búsqueda).
 * `onCambio(parcial)` recibe {estadoAmistad, solicitudId} para actualizar la fila.
 */
const BotonAmistadRapido = ({ usuario, onCambio }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const { refrescar } = useMensajes();
    const [ocupado, setOcupado] = useState(false);

    const agregar = async () => {
        setOcupado(true);
        try {
            const r = await enviarSolicitud(usuario.id);
            const amigos = /ACEPT|AMIG/i.test(r?.estado || '');
            onCambio?.({ estadoAmistad: amigos ? 'AMIGOS' : 'ENVIADA', solicitudId: r?.solicitudId ?? null });
            toast.success(amigos ? `Ya eres amigo de ${usuario.username}.` : `Solicitud enviada a ${usuario.username}.`);
            refrescar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setOcupado(false);
        }
    };

    switch (usuario.estadoAmistad) {
        case 'NINGUNA':
            return (
                <button type="button" className="gm-btn gm-btn--primary gm-btn--sm am-quick" onClick={agregar} disabled={ocupado} aria-label={`Agregar a ${usuario.username} como amigo`}>
                    <HiUserPlus size={16} aria-hidden="true" /> {ocupado ? '…' : 'Agregar'}
                </button>
            );
        case 'ENVIADA':
            return <span className="am-estado"><HiClock size={14} aria-hidden="true" /> Enviada</span>;
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
