import React from 'react';
import { resolveItemImage } from '../utils/itemImage';
import './gamificacion.css';

const VAR_RAREZA = { COMUN: 'common', RARO: 'rare', EPICO: 'epic', LEGENDARIO: 'legendary' };
const colorRareza = (item) => (item ? `var(--rarity-${VAR_RAREZA[item.rareza] || 'common'})` : undefined);

/** Avatar compuesto: skin + marco (aro con color de rareza y emblema) + mascota acompañante. */
const CharacterAvatar = ({ size = 96, skin, marco, mascota, alt = 'Tu personaje' }) => (
    <div
        className="gm-avatar"
        style={{ width: size, height: size, '--rc': colorRareza(marco), '--rcm': colorRareza(marco), '--rcp': colorRareza(mascota) }}
    >
        <div className="gm-avatar-ring"><img src={resolveItemImage(skin)} alt={alt} /></div>
        {marco && (
            <div className="gm-avatar-emblem" title={`Marco: ${marco.nombre}`}>
                <img src={resolveItemImage(marco.imagen)} alt="" />
            </div>
        )}
        {mascota && (
            <div className="gm-avatar-pet" title={`Mascota: ${mascota.nombre}`}>
                <img src={resolveItemImage(mascota.imagen)} alt={`Mascota ${mascota.nombre}`} />
            </div>
        )}
    </div>
);

export default CharacterAvatar;
