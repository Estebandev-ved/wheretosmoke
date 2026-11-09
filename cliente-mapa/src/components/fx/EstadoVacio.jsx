import React from 'react';
import { useGamificacion } from '../../hooks/useGamificacion';
import { resolveItemImage } from '../../utils/itemImage';

/** Estado vacío con la mascota equipada (o el cogollo) que respira. */
const EstadoVacio = ({ texto, children }) => {
    const { equipadosItems } = useGamificacion();
    const m = equipadosItems?.MASCOTA;
    return (
        <div className="gm-card gm-state fx-vacio">
            <img src={m ? resolveItemImage(m.imagen) : '/icons/bud_smoking.png'} alt="" />
            <p>{texto}</p>
            {children}
        </div>
    );
};

export default EstadoVacio;
