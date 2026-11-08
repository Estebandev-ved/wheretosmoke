import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import RatingStars from './RatingStars';
import PhotoUploader from './PhotoUploader';
import AlertHistory from './AlertHistory';
import { useAuth } from '../context/AuthContext';

const API_URL = API_BASE;

/**
 * 📍 MODAL DE DETALLE DE SPOT
 * 
 * Vista completa de un spot con fotos, comentarios, calificaciones, historial
 */
const SpotDetailModal = ({
    spot,
    darkMode = false,
    onClose = () => { },
    onFavoriteChange = () => { }
}) => {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('info');
    const [detalle, setDetalle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comentarioTexto, setComentarioTexto] = useState('');
    const [miCalificacion, setMiCalificacion] = useState({
        estrellas: 0,
        privacidad: 0,
        ambiente: 0,
        vista: 0,
        accesibilidad: 0
    });

    useEffect(() => {
        if (spot) {
            cargarDetalle();
        }
    }, [spot?.id]);

    const cargarDetalle = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/spots/${spot.id}/detalle`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setDetalle(data);
        } catch (error) {
            console.error('Error cargando detalle:', error);
            toast.error('Error cargando información');
        }
        setLoading(false);
    };

    const toggleFavorito = async () => {
        if (!user) {
            toast.warning('🔐 Inicia sesión para agregar favoritos');
            return;
        }

        try {
            if (detalle?.esFavorito) {
                await axios.delete(`${API_URL}/favoritos/${spot.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDetalle({ ...detalle, esFavorito: false });
                toast.success('💔 Quitado de favoritos');
            } else {
                await axios.post(`${API_URL}/favoritos/${spot.id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDetalle({ ...detalle, esFavorito: true });
                toast.success('❤️ Agregado a favoritos');
            }
            onFavoriteChange();
        } catch (error) {
            toast.error('Error actualizando favoritos');
        }
    };

    const subirFoto = async (imageData, descripcion) => {
        try {
            const { data } = await axios.post(`${API_URL}/spots/${spot.id}/fotos`, {
                imageData,
                descripcion
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setDetalle({
                ...detalle,
                fotos: [data, ...(detalle.fotos || [])],
                totalFotos: (detalle.totalFotos || 0) + 1
            });
            toast.success('📸 Foto subida!');
        } catch (error) {
            throw error;
        }
    };

    const agregarComentario = async () => {
        if (!comentarioTexto.trim()) {
            toast.warning('Escribe un comentario');
            return;
        }

        try {
            const { data } = await axios.post(`${API_URL}/spots/${spot.id}/comentarios`, {
                texto: comentarioTexto
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setDetalle({
                ...detalle,
                comentarios: [data, ...(detalle.comentarios || [])],
                totalComentarios: (detalle.totalComentarios || 0) + 1
            });
            setComentarioTexto('');
            toast.success('💬 Comentario agregado!');
        } catch (error) {
            toast.error('Error agregando comentario');
        }
    };

    const enviarCalificacion = async () => {
        if (miCalificacion.estrellas === 0) {
            toast.warning('Selecciona una calificación');
            return;
        }
        if (!user) {
            toast.warning('🔐 Inicia sesión para calificar');
            return;
        }

        try {
            const { data } = await axios.post(`${API_URL}/spots/${spot.id}/calificar`, miCalificacion, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDetalle({
                ...detalle,
                calificacionesDetalle: data,
                calificacionPromedio: data.promedioGeneral
            });
            toast.success('⭐ Calificación guardada!');
        } catch (error) {
            toast.error('Error guardando calificación');
        }
    };

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        },
        modal: {
            width: '100%',
            maxWidth: '500px',
            maxHeight: '85vh',
            backgroundColor: darkMode ? 'var(--surface)' : 'white',
            border: darkMode ? '1px solid var(--border-subtle)' : 'none',
            boxShadow: 'var(--elev-2)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        },
        header: {
            padding: '15px 20px',
            backgroundColor: spot?.estado === 'ROJO' ? '#ef4444' : 'var(--accent-strong)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        closeBtn: {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
        },
        title: {
            fontFamily: 'var(--font-display)',
            flex: 1,
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0
        },
        favoriteBtn: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer'
        },
        tabs: {
            display: 'flex',
            borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`
        },
        tab: (active) => ({
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: active ? (darkMode ? '#333' : '#f5f5f5') : 'transparent',
            color: active ? (darkMode ? 'white' : '#333') : (darkMode ? '#888' : '#999'),
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: active ? 'bold' : 'normal'
        }),
        content: {
            flex: 1,
            overflowY: 'auto',
            padding: '15px'
        },
        section: {
            marginBottom: '20px'
        },
        sectionTitle: {
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: darkMode ? 'white' : '#333'
        },
        badge: (type) => ({
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold',
            backgroundColor: type === 'categoria'
                ? (darkMode ? '#333' : '#e3f2fd')
                : (darkMode ? '#2c2c2c' : '#f5f5f5'),
            color: darkMode ? '#aaa' : '#666'
        }),
        input: {
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
            backgroundColor: darkMode ? '#2c2c2c' : 'white',
            color: darkMode ? 'white' : '#333',
            marginBottom: '10px',
            boxSizing: 'border-box'
        },
        button: {
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#00C851',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer'
        },
        fotosGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px'
        },
        foto: {
            width: '100%',
            height: '120px',
            objectFit: 'cover',
            borderRadius: '10px'
        },
        comentario: {
            backgroundColor: darkMode ? '#2c2c2c' : '#f5f5f5',
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '10px'
        },
        comentarioUser: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: darkMode ? '#00C851' : '#007bff',
            marginBottom: '5px'
        },
        comentarioTexto: {
            fontSize: '13px',
            color: darkMode ? '#ccc' : '#666',
            margin: 0
        },
        ratingRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
        },
        ratingLabel: {
            fontSize: '13px',
            color: darkMode ? '#ccc' : '#666'
        }
    };

    if (!spot) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.closeBtn} onClick={onClose} aria-label="Volver">←</button>
                    <h2 style={styles.title}>{spot.nombre}</h2>
                    <button style={styles.favoriteBtn} onClick={toggleFavorito}>
                        {detalle?.esFavorito ? '❤️' : '🤍'}
                    </button>
                </div>

                {/* Tabs */}
                <div style={styles.tabs}>
                    <button style={styles.tab(activeTab === 'info')} onClick={() => setActiveTab('info')}>
                        📍 Info
                    </button>
                    <button style={styles.tab(activeTab === 'fotos')} onClick={() => setActiveTab('fotos')}>
                        📸 Fotos ({detalle?.totalFotos || 0})
                    </button>
                    <button style={styles.tab(activeTab === 'comentarios')} onClick={() => setActiveTab('comentarios')}>
                        💬 ({detalle?.totalComentarios || 0})
                    </button>
                    <button style={styles.tab(activeTab === 'historial')} onClick={() => setActiveTab('historial')}>
                        📊
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            Cargando...
                        </div>
                    ) : (
                        <>
                            {/* Tab: Info */}
                            {activeTab === 'info' && (
                                <>
                                    <div style={styles.section}>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                            {detalle?.categoria && (
                                                <span style={styles.badge('categoria')}>
                                                    {detalle.categoria}
                                                </span>
                                            )}
                                            {detalle?.horarioRecomendado && (
                                                <span style={styles.badge()}>
                                                    🕐 {detalle.horarioRecomendado}
                                                </span>
                                            )}
                                        </div>

                                        {spot.descripcion && (
                                            <p style={{ color: darkMode ? '#ccc' : '#666', fontSize: '14px', marginBottom: '15px' }}>
                                                {spot.descripcion}
                                            </p>
                                        )}

                                        {/* Rating promedio */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                            <RatingStars rating={Math.round(detalle?.calificacionPromedio || 0)} darkMode={darkMode} />
                                            <span style={{ color: darkMode ? '#888' : '#999', fontSize: '13px' }}>
                                                ({detalle?.totalCalificaciones || 0} calificaciones)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mi calificación */}
                                    <div style={styles.section}>
                                        <div style={styles.sectionTitle}>⭐ Tu Calificación</div>

                                        <div style={styles.ratingRow}>
                                            <span style={styles.ratingLabel}>General</span>
                                            <RatingStars
                                                rating={miCalificacion.estrellas}
                                                interactive
                                                onChange={(v) => setMiCalificacion({ ...miCalificacion, estrellas: v })}
                                                darkMode={darkMode}
                                            />
                                        </div>

                                        <div style={styles.ratingRow}>
                                            <span style={styles.ratingLabel}>🔒 Privacidad</span>
                                            <RatingStars
                                                rating={miCalificacion.privacidad}
                                                interactive
                                                size={18}
                                                onChange={(v) => setMiCalificacion({ ...miCalificacion, privacidad: v })}
                                                darkMode={darkMode}
                                            />
                                        </div>

                                        <div style={styles.ratingRow}>
                                            <span style={styles.ratingLabel}>🌿 Ambiente</span>
                                            <RatingStars
                                                rating={miCalificacion.ambiente}
                                                interactive
                                                size={18}
                                                onChange={(v) => setMiCalificacion({ ...miCalificacion, ambiente: v })}
                                                darkMode={darkMode}
                                            />
                                        </div>

                                        <button style={styles.button} onClick={enviarCalificacion}>
                                            Guardar Calificación
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Tab: Fotos */}
                            {activeTab === 'fotos' && (
                                <>
                                    <PhotoUploader
                                        darkMode={darkMode}
                                        onUpload={subirFoto}
                                    />

                                    {detalle?.fotos?.length > 0 ? (
                                        <div style={styles.fotosGrid}>
                                            {detalle.fotos.map((foto, i) => (
                                                <img
                                                    key={i}
                                                    src={foto.imageData}
                                                    alt={foto.descripcion || 'Foto'}
                                                    style={styles.foto}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: darkMode ? '#666' : '#999', padding: '20px' }}>
                                            Sé el primero en subir una foto 📸
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Tab: Comentarios */}
                            {activeTab === 'comentarios' && (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <textarea
                                            placeholder="Escribe un comentario..."
                                            value={comentarioTexto}
                                            onChange={(e) => setComentarioTexto(e.target.value)}
                                            style={{ ...styles.input, resize: 'none', height: '80px' }}
                                        />
                                        <button style={styles.button} onClick={agregarComentario}>
                                            💬 Comentar
                                        </button>
                                    </div>

                                    {detalle?.comentarios?.map((c, i) => (
                                        <div key={i} style={styles.comentario}>
                                            <div style={styles.comentarioUser}>
                                                {c.usuarioNombre || 'Anónimo'}
                                            </div>
                                            <p style={styles.comentarioTexto}>{c.texto}</p>
                                        </div>
                                    ))}

                                    {(!detalle?.comentarios || detalle.comentarios.length === 0) && (
                                        <div style={{ textAlign: 'center', color: darkMode ? '#666' : '#999', padding: '20px' }}>
                                            Sin comentarios aún
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Tab: Historial */}
                            {activeTab === 'historial' && (
                                <AlertHistory
                                    historial={detalle?.historialAlertas || []}
                                    patrones={detalle?.patronesAlerta}
                                    darkMode={darkMode}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpotDetailModal;
