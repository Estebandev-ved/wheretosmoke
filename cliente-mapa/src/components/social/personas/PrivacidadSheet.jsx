import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiShieldCheck } from 'react-icons/hi2';
import BottomSheet from '../../BottomSheet';
import { useToast } from '../../WeedToast';
import useHaptics from '../../../hooks/useHaptics';
import { getPrivacidad, guardarPrivacidad, mensajeError } from '../../../services/amigosApi';
import './personas.css';

const QUIEN = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'AMIGOS_DE_AMIGOS', label: 'Amigos de mis amigos' },
    { key: 'NADIE', label: 'Nadie' },
];

/** Hoja "Privacidad social": guarda cada cambio al instante y revierte si falla. */
const PrivacidadSheet = ({ onClose }) => {
    const toast = useToast();
    const h = useHaptics();
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState(null);
    const [ocupado, setOcupado] = useState(false);
    const [aviso, setAviso] = useState('');

    useEffect(() => {
        let vivo = true;
        getPrivacidad()
            .then((d) => { if (vivo) setDatos({ visibleEnSugerencias: d?.visibleEnSugerencias !== false, aceptaSolicitudes: d?.aceptaSolicitudes || 'TODOS' }); })
            .catch((e) => { if (vivo) setError(mensajeError(e, 'No pudimos cargar tu privacidad.')); });
        return () => { vivo = false; };
    }, []);

    const cambiar = async (parcial) => {
        const previo = datos;
        const nuevo = { ...datos, ...parcial };
        setDatos(nuevo);
        setOcupado(true);
        setAviso('Guardando…');
        try {
            const r = await guardarPrivacidad(nuevo);
            if (r && typeof r === 'object' && 'aceptaSolicitudes' in r) setDatos({ visibleEnSugerencias: r.visibleEnSugerencias !== false, aceptaSolicitudes: r.aceptaSolicitudes });
            setAviso('Guardado');
            h.tap();
        } catch (e) {
            setDatos(previo);
            setAviso('');
            toast.error(mensajeError(e));
        } finally {
            setOcupado(false);
        }
    };

    let cuerpo;
    if (error) cuerpo = <p className="pe-nota" role="alert">{error}</p>;
    else if (!datos) cuerpo = <div className="gm-skel" style={{ height: 160 }} aria-busy="true" aria-label="Cargando" />;
    else {
        cuerpo = (
            <>
                <div className="gm-card pe-priv">
                    <div>
                        <strong id="pe-sug-t">Aparecer en sugerencias</strong>
                        <small>Otras personas podrán verte en “Gente que quizás conozcas”.</small>
                    </div>
                    <button
                        type="button" role="switch" className="pe-switch" aria-labelledby="pe-sug-t"
                        aria-checked={datos.visibleEnSugerencias} disabled={ocupado}
                        onClick={() => cambiar({ visibleEnSugerencias: !datos.visibleEnSugerencias })}
                    />
                </div>
                <fieldset className="pe-radios" disabled={ocupado}>
                    <legend>Quién puede enviarme solicitudes</legend>
                    {QUIEN.map((o) => (
                        <label key={o.key} className="pe-radio">
                            <input type="radio" name="acepta" checked={datos.aceptaSolicitudes === o.key} onChange={() => cambiar({ aceptaSolicitudes: o.key })} />
                            {o.label}
                        </label>
                    ))}
                </fieldset>
                <p className="pe-guardado" role="status" aria-live="polite">{aviso}</p>
            </>
        );
    }

    return createPortal(
        <BottomSheet title="Privacidad social" subtitle="Tú decides quién te encuentra." icon={HiShieldCheck} onClose={onClose} className="pe-sheet">
            <div className="pe-sheet__body">{cuerpo}</div>
        </BottomSheet>,
        document.body
    );
};

export default PrivacidadSheet;
