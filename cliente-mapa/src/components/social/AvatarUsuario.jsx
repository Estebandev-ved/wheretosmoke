import React from 'react';
import CharacterAvatar from '../CharacterAvatar';
import { propsAvatar } from '../../utils/social';

/** Avatar compuesto de otra persona a partir de su `equipados` ({CAT: imagen}). */
const AvatarUsuario = ({ usuario, size = 44 }) => (
    <CharacterAvatar size={size} {...propsAvatar(usuario?.equipados)} alt={`Personaje de ${usuario?.username ?? 'usuario'}`} />
);

export default AvatarUsuario;
