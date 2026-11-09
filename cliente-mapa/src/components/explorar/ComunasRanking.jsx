import React, { useCallback, useEffect, useState } from 'react';
import { HiArrowPath, HiUsers, HiMapPin } from 'react-icons/hi2';
import { getRankingComunas } from '../../services/socialApi';
import CharacterAvatar from '../CharacterAvatar';

const Esqueleto = () => (
    <div className="ex-loading" aria-busy="true" aria-label="Cargando comunas">
        {[0, 1, 2].map((i) => <div key={i} className="gm-skel ex-skel-terr" />)}
    </div>
);

const ComunasRanking = () => {
    const [lista, setLista] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(false);
        try {
            const d = await getRankingComunas();
            setLista(Array.isArray(d) ? d : []);
        } catch (e) {
            console.error('Error cargando comunas:', e);
            setError(true);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    if (cargando) return <Esqueleto />;

    if (error) {
        return (
            <div className="gm-card gm-state" role="alert">
                <img src="/icons/bud_angry.png" alt="" width="88" height="88" />
                <h2>No pudimos cargar las comunas</h2>
                <p>Revisa tu conexión e inténtalo otra vez.</p>
                <button type="button" className="gm-btn gm-btn--primary" onClick={cargar}>
                    <HiArrowPath size={16} aria-hidden="true" /> Reintentar
                </button>
            </div>
        );
    }

    if (lista.length === 0) {
        return (
            <div className="gm-card gm-state">
                <img src="/icons/bud_map.png" alt="" width="88" height="88" />
                <h2>Ninguna comuna ha arrancado</h2>
                <p>Crea spots y gana XP para que tu comuna conquiste el territorio.</p>
            </div>
        );
    }

    const lider = Math.max(1, ...lista.map((c) => c.xpTotal || 0));

    return (
        <ol className="ex-terr-list" aria-label="Ranking de comunas por XP">
            {lista.map((c) => {
                const pct = Math.round(((c.xpTotal || 0) / lider) * 100);
                const top = (c.top || []).slice(0, 3);
                return (
                    <li key={c.comuna} className={`gm-card ex-terr${c.posicion === 1 && c.xpTotal > 0 ? ' is-lider' : ''}`}>
                        <div className="ex-terr-head">
                            <span className="ex-rank-pos" aria-label={`Puesto ${c.posicion}`}>{c.posicion}</span>
                            <div className="ex-terr-name">
                                <strong>{c.comuna}</strong>
                                <span>
                                    <HiUsers size={12} aria-hidden="true" /> {c.usuariosActivos ?? 0} activos
                                    <HiMapPin size={12} aria-hidden="true" /> {c.totalSpots ?? 0} spots
                                </span>
                            </div>
                            <span className="ex-rank-xp">{(c.xpTotal ?? 0).toLocaleString('es-CO')} XP</span>
                        </div>
                        <div className="gm-bar gm-bar--thin" role="img" aria-label={`${pct}% del XP de la comuna líder`}>
                            <span style={{ width: `${pct}%` }} />
                        </div>
                        {top.length > 0 ? (
                            <ul className="ex-terr-top" aria-label={`Mejores de ${c.comuna}`}>
                                {top.map((u) => (
                                    <li key={u.usuarioId}>
                                        <CharacterAvatar size={28} alt="" />
                                        <span className="ex-terr-user">@{u.username}</span>
                                        <small>{u.puntos} XP</small>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="ex-terr-empty">Territorio libre: nadie lo ha reclamado todavía.</p>
                        )}
                    </li>
                );
            })}
        </ol>
    );
};

export default ComunasRanking;
