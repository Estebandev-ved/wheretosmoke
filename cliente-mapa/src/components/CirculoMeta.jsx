import React, { useCallback, useEffect, useState } from 'react';
import { HiGift, HiCheckCircle } from 'react-icons/hi2';
import { getMetaCirculo, reclamarMetaCirculo, mensajeError } from '../services/socialApi';
import { useGamificacion } from '../hooks/useGamificacion';
import './gamificacion.css';
import './social.css';

const cuentaAtras = (seg) => {
    if (seg == null || seg <= 0) return 'Se renueva el lunes';
    const d = Math.floor(seg / 86400);
    const h = Math.floor((seg % 86400) / 3600);
    const m = Math.floor((seg % 3600) / 60);
    if (d > 0) return `Se renueva en ${d} d ${h} h`;
    if (h > 0) return `Se renueva en ${h} h ${m} min`;
    return `Se renueva en ${Math.max(1, m)} min`;
};

/** Tarjeta de meta semanal de un círculo (dentro de la hoja de círculos). */
const CirculoMeta = ({ circleId }) => {
    const g = useGamificacion();
    const refreshPerfil = g?.refresh;
    const [meta, setMeta] = useState(null);
    const [error, setError] = useState(false);
    const [reclamando, setReclamando] = useState(false);
    const [aviso, setAviso] = useState(null);
    const hayReloj = meta?.segundosRestantes != null;

    const cargar = useCallback(async () => {
        setError(false);
        try { setMeta(await getMetaCirculo(circleId)); } catch { setError(true); }
    }, [circleId]);

    useEffect(() => { cargar(); }, [cargar]);

    // Cuenta atrás local: baja cada minuto sin volver a pedir al servidor
    useEffect(() => {
        if (!hayReloj) return undefined;
        const t = setInterval(() => {
            setMeta((m) => (m ? { ...m, segundosRestantes: Math.max(0, m.segundosRestantes - 60) } : m));
        }, 60000);
        return () => clearInterval(t);
    }, [hayReloj]);

    const reclamar = async () => {
        setReclamando(true);
        setAviso(null);
        try {
            const r = await reclamarMetaCirculo(circleId);
            setMeta((m) => (m ? { ...m, yaReclamado: true } : m));
            setAviso({ tipo: 'ok', texto: `+${r.monedasGanadas} monedas y +${r.xpGanado} XP${r.subioNivel ? ' · ¡subiste de nivel!' : ''}` });
            refreshPerfil?.();
        } catch (e) {
            setAviso({ tipo: 'error', texto: mensajeError(e, 'No se pudo reclamar el cofre.') });
        } finally {
            setReclamando(false);
        }
    };

    if (error) {
        return (
            <div className="cm-card cm-card--msg">
                <span>No pudimos cargar la meta semanal.</span>
                <button type="button" className="gm-btn gm-btn--sm" onClick={cargar}>Reintentar</button>
            </div>
        );
    }
    if (!meta) return <div className="gm-skel cm-skel" aria-busy="true" aria-label="Cargando meta semanal" />;

    const objetivo = Math.max(1, meta.objetivo || 1);
    const progreso = Math.min(meta.progreso || 0, objetivo);
    const pct = Math.round((progreso / objetivo) * 100);

    return (
        <section className="cm-card" aria-label="Meta semanal del círculo">
            <div className="cm-head">
                <strong>Meta semanal</strong>
                <small>{cuentaAtras(meta.segundosRestantes)}</small>
            </div>
            <p className="cm-count"><b>{progreso}</b> / {objetivo} <span>actividad del círculo</span></p>
            <div className="gm-bar cm-bar" role="progressbar" aria-valuemin={0} aria-valuemax={objetivo} aria-valuenow={progreso} aria-label="Progreso de la meta semanal">
                <span style={{ width: `${pct}%` }} />
            </div>
            <div className="cm-foot">
                <span className="cm-prize"><HiGift size={16} aria-hidden="true" /> +{meta.recompensaMonedas} monedas · +{meta.recompensaXp} XP</span>
                {meta.yaReclamado ? (
                    <span className="cm-done"><HiCheckCircle size={18} aria-hidden="true" /> Cofre reclamado</span>
                ) : (
                    <button type="button" className="gm-btn gm-btn--primary gm-btn--sm" disabled={!meta.completada || reclamando} onClick={reclamar}>
                        <HiGift size={16} aria-hidden="true" /> {reclamando ? 'Abriendo...' : meta.completada ? 'Reclamar cofre' : 'Meta sin completar'}
                    </button>
                )}
            </div>
            {aviso && <p className={`cm-aviso is-${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>{aviso.texto}</p>}
        </section>
    );
};

export default CirculoMeta;
