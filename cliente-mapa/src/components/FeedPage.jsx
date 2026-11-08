import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiPhoto, HiHeart, HiChatBubbleLeft, HiMapPin, HiSparkles, HiShieldExclamation, HiPaperAirplane } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import './feed-page.css';

const API_URL = API_BASE;

/**
 * 📸 FEED PAGE - Feed de fotos con likes y comentarios
 */
const FeedPage = ({ darkMode = false }) => {
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedComments, setExpandedComments] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [likedPhotos, setLikedPhotos] = useState({});
    const [likingPhoto, setLikingPhoto] = useState(null);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        cargarFeed();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const cargarFeed = async () => {
        setLoading(true);
        try {
            const { data: spotsData } = await axios.get(`${API_URL}/spots`);

            const feedPromises = spotsData
                .filter(dto => dto.spot && dto.spot.cantidadFotos > 0)
                .slice(0, 15)
                .map(async (dto) => {
                    try {
                        const { data: fotos } = await axios.get(`${API_URL}/spots/${dto.spot.id}/fotos`);
                        return fotos.map(foto => ({
                            ...foto,
                            spotNombre: dto.spot.nombre,
                            spotEstado: dto.spot.estado,
                        }));
                    } catch {
                        return [];
                    }
                });

            const fotosArrays = await Promise.all(feedPromises);
            const allFotos = fotosArrays
                .flat()
                .sort((a, b) => new Date(b.fechaSubida) - new Date(a.fechaSubida))
                .slice(0, 30);

            setFeedItems(allFotos);
        } catch (error) {
            console.error('Error cargando feed:', error);
            setFeedItems([]);
        }
        setLoading(false);
    };

    // ─── Like Toggle ───
    const handleLike = async (fotoId) => {
        if (!isAuthenticated) return;
        if (likingPhoto === fotoId) return;

        setLikingPhoto(fotoId);
        try {
            const { data } = await axios.post(
                `${API_URL}/fotos/${fotoId}/like`,
                {},
                { headers: getAuthHeaders() }
            );

            // Actualizar contador de likes en el feed
            setFeedItems(prev =>
                prev.map(item => item.id === fotoId ? { ...item, likes: data.likes } : item)
            );

            // Actualizar estado de like del usuario
            setLikedPhotos(prev => ({ ...prev, [fotoId]: data.liked }));
        } catch (error) {
            console.error('Error dando like:', error);
        }
        setTimeout(() => setLikingPhoto(null), 300);
    };

    // ─── Comments ───
    const toggleComments = async (fotoId) => {
        const isOpen = expandedComments[fotoId];
        setExpandedComments(prev => ({ ...prev, [fotoId]: !isOpen }));

        if (!isOpen && !comments[fotoId]) {
            try {
                const { data } = await axios.get(`${API_URL}/fotos/${fotoId}/comentarios`);
                setComments(prev => ({ ...prev, [fotoId]: data }));
            } catch (error) {
                console.error('Error cargando comentarios:', error);
                setComments(prev => ({ ...prev, [fotoId]: [] }));
            }
        }
    };

    const handleAddComment = async (fotoId) => {
        const texto = (newComment[fotoId] || '').trim();
        if (!texto || !isAuthenticated) return;

        try {
            const { data } = await axios.post(
                `${API_URL}/fotos/${fotoId}/comentarios`,
                { texto },
                { headers: getAuthHeaders() }
            );

            setComments(prev => ({
                ...prev,
                [fotoId]: [data, ...(prev[fotoId] || [])]
            }));
            setNewComment(prev => ({ ...prev, [fotoId]: '' }));
        } catch (error) {
            console.error('Error agregando comentario:', error);
        }
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const isLiked = (fotoId) => likedPhotos[fotoId] === true;

    return (
        <div className={`feed-page ${darkMode ? '' : 'light'}`}>
            {/* Header */}
            <div className="feed-header">
                <div>
                    <h1 className="feed-title">
                        <HiPhoto size={28} />
                        Feed
                    </h1>
                    <p className="feed-subtitle">Últimas fotos de la comunidad</p>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="feed-loading">
                    <div className="feed-spinner"></div>
                    <span>Cargando fotos...</span>
                </div>
            ) : feedItems.length > 0 ? (
                <div className="feed-grid">
                    {feedItems.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="feed-card"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {/* Card Header */}
                            <div className="feed-card-header">
                                <div className="feed-card-avatar">
                                    {getInitials(item.usuarioNombre || 'Anon')}
                                </div>
                                <div className="feed-card-info">
                                    <div className="feed-card-username">
                                        {item.usuarioNombre || 'Anónimo'}
                                    </div>
                                    <div className="feed-card-spot">
                                        <HiMapPin size={12} />
                                        {item.spotNombre || 'Spot'}
                                        <span className={`feed-status-badge ${item.spotEstado === 'ROJO' ? 'tombo' : 'relax'}`}>
                                            {item.spotEstado === 'ROJO' ? (
                                                <><HiShieldExclamation size={10} /> Alerta</>
                                            ) : (
                                                <><HiSparkles size={10} /> Relax</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <span className="feed-card-time">{formatTimeAgo(item.fechaSubida)}</span>
                            </div>

                            {/* Image — double-tap to like */}
                            {item.imageData && (
                                <img
                                    src={item.imageData}
                                    alt={item.descripcion || 'Foto del spot'}
                                    className="feed-card-image"
                                    loading="lazy"
                                    onDoubleClick={() => handleLike(item.id)}
                                />
                            )}

                            {/* Footer */}
                            <div className="feed-card-footer">
                                <div className="feed-card-actions">
                                    <button
                                        className={`feed-action-btn ${isLiked(item.id) ? 'liked' : ''}`}
                                        onClick={() => handleLike(item.id)}
                                        title={isAuthenticated ? 'Me gusta' : 'Inicia sesión para dar like'}
                                    >
                                        <HiHeart
                                            size={20}
                                            className="icon"
                                            style={{
                                                color: isLiked(item.id) ? '#e74c3c' : undefined,
                                                fill: isLiked(item.id) ? '#e74c3c' : 'none',
                                                transform: likingPhoto === item.id ? 'scale(1.3)' : 'scale(1)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        />
                                        <span>{item.likes || 0}</span>
                                    </button>
                                    <button
                                        className="feed-action-btn"
                                        onClick={() => toggleComments(item.id)}
                                    >
                                        <HiChatBubbleLeft size={20} className="icon" />
                                        <span>
                                            {comments[item.id]?.length || ''}
                                        </span>
                                    </button>
                                </div>

                                {item.descripcion && (
                                    <p className="feed-card-desc">
                                        <strong>{item.usuarioNombre || 'Anónimo'}</strong>{' '}
                                        {item.descripcion}
                                    </p>
                                )}

                                {/* ─── Comments Section ─── */}
                                {expandedComments[item.id] && (
                                    <div className="feed-comments">
                                        {/* Comment Input */}
                                        <div className="feed-comment-input-row">
                                            <input
                                                type="text"
                                                className="feed-comment-input"
                                                placeholder={isAuthenticated ? 'Escribe un comentario...' : 'Inicia sesión para comentar'}
                                                value={newComment[item.id] || ''}
                                                onChange={(e) => setNewComment(prev => ({
                                                    ...prev,
                                                    [item.id]: e.target.value
                                                }))}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddComment(item.id);
                                                }}
                                                disabled={!isAuthenticated}
                                            />
                                            <button
                                                className="feed-comment-send"
                                                onClick={() => handleAddComment(item.id)}
                                                disabled={!isAuthenticated || !(newComment[item.id] || '').trim()}
                                            >
                                                <HiPaperAirplane size={16} />
                                            </button>
                                        </div>

                                        {/* Comment List */}
                                        {(comments[item.id] || []).length > 0 ? (
                                            <div className="feed-comment-list">
                                                {(comments[item.id] || []).map((c, ci) => (
                                                    <div key={c.id || ci} className="feed-comment">
                                                        <strong className="feed-comment-user">{c.usuarioNombre || 'Anónimo'}</strong>
                                                        <span className="feed-comment-text">{c.texto}</span>
                                                        <span className="feed-comment-time">{formatTimeAgo(c.fecha)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="feed-comment-empty">Sin comentarios aún</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="feed-empty">
                    <div className="feed-empty-icon"><HiPhoto size={48} /></div>
                    <div className="feed-empty-text">No hay fotos aún</div>
                    <div className="feed-empty-hint">
                        Sé el primero en subir una foto a un spot
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedPage;
