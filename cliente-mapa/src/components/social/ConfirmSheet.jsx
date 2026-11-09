import React from 'react';
import { createPortal } from 'react-dom';
import BottomSheet from '../BottomSheet';

/** Confirmación en hoja inferior para acciones destructivas (eliminar amigo, bloquear). Va en un portal: queda sobre la barra de navegación. */
const ConfirmSheet = ({ titulo, mensaje, confirmar = 'Confirmar', peligro = false, ocupado = false, onConfirm, onClose }) => createPortal(
    <BottomSheet title={titulo} onClose={onClose} className="su-confirm">
        <p className="su-confirm__txt">{mensaje}</p>
        <div className="su-confirm__acc">
            <button type="button" className="gm-btn" onClick={onClose} disabled={ocupado}>Cancelar</button>
            <button type="button" className={`gm-btn ${peligro ? 'su-btn-danger' : 'gm-btn--primary'}`} onClick={onConfirm} disabled={ocupado}>
                {ocupado ? 'Un momento…' : confirmar}
            </button>
        </div>
    </BottomSheet>,
    document.body
);

export default ConfirmSheet;
