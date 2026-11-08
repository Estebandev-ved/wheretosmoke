import { useContext } from 'react';
import GamificacionContext from '../context/gamificacionStore';

export const useGamificacion = () => {
    const ctx = useContext(GamificacionContext);
    if (!ctx) throw new Error('useGamificacion debe usarse dentro de GamificacionProvider');
    return ctx;
};

export default useGamificacion;
