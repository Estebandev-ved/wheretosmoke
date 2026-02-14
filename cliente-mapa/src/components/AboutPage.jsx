import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    HiMapPin, HiShieldCheck, HiPhoto, HiChatBubbleLeftRight,
    HiStar, HiUserGroup, HiArrowsRightLeft, HiHeart,
    HiTrophy, HiGlobeAmericas, HiEye, HiHandRaised,
    HiSparkles, HiLockClosed
} from 'react-icons/hi2';
import './about-page.css';

const API_URL = 'http://localhost:8081/api';

/**
 * ℹ️ ABOUT PAGE - Quiénes Somos
 * 
 * Página rica con valores, features, personajes y stats.
 * Personajes en /public/icons/: bud_smoking.png, bud_map.png, bud_angry.png, bud_police.png
 */
const AboutPage = ({ darkMode = false }) => {
    const [stats, setStats] = useState({ spots: 0, usuarios: 0, fotos: 0 });

    useEffect(() => {
        cargarStats();
    }, []);

    const cargarStats = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/spots`);
            setStats({
                spots: data.length || 0,
                usuarios: '100+',
                fotos: data.reduce((acc, dto) => acc + (dto.spot?.cantidadFotos || 0), 0)
            });
        } catch (error) {
            console.error('Error cargando stats:', error);
        }
    };

    const features = [
        {
            icon: <HiMapPin size={20} />,
            title: 'Spots en Tiempo Real',
            desc: 'Descubre y comparte los mejores spots de Medellín actualizados por la comunidad.'
        },
        {
            icon: <HiShieldCheck size={20} />,
            title: 'Alertas de Seguridad',
            desc: 'Reporta y recibe alertas en tiempo real de la presencia de las autoridades.'
        },
        {
            icon: <HiPhoto size={20} />,
            title: 'Fotos de la Comunidad',
            desc: 'Sube fotos de tus spots favoritos y descubre los de otros usuarios.'
        },
        {
            icon: <HiChatBubbleLeftRight size={20} />,
            title: 'GeoChat',
            desc: 'Chatea en tiempo real con personas cerca de tu zona.'
        },
        {
            icon: <HiStar size={20} />,
            title: 'Calificaciones',
            desc: 'Califica spots por privacidad, ambiente, vista y accesibilidad.'
        },
        {
            icon: <HiArrowsRightLeft size={20} />,
            title: 'Rutas Seguras',
            desc: 'Calcula rutas de bajo perfil evitando zonas con reportes activos.'
        }
    ];

    const values = [
        {
            icon: <HiUserGroup size={22} />,
            title: 'Comunidad Primero',
            desc: 'Todo lo que hacemos es por y para la comunidad. Cada feature nace de una necesidad real de los usuarios.'
        },
        {
            icon: <HiLockClosed size={22} />,
            title: 'Privacidad Total',
            desc: 'Tu información es tuya. No vendemos datos ni rastreamos tu ubicación más allá de lo necesario.'
        },
        {
            icon: <HiGlobeAmericas size={22} />,
            title: 'Cultura Local',
            desc: 'Celebramos la cultura de Medellín. Cada spot cuenta una historia de la ciudad y su gente.'
        },
        {
            icon: <HiHandRaised size={22} />,
            title: 'Confianza',
            desc: 'Construimos confianza con transparencia. Los reportes y calificaciones son reales y verificables.'
        }
    ];

    // Personajes con su descripción
    const characters = [
        {
            img: '/icons/bud_smoking.png',
            name: 'Tren A Vapor',
            desc: 'El maquinista de la ciudad. Se conoce los spots más calidos de Medallo. Si busca dónde quemar, péguese al Tren que este viaje no tiene reversa. ¡Suba que el humo está espeso!'
        },
        {
            img: '/icons/bud_map.png',
            name: 'Jack Sparrow',
            desc: 'El pirata del parche. Aborda a la gallada cerca para que nadie ruede solo. Si llegó al spot y quiere saber quién más está en la jugada, Jack le tira el puente. ¡El botín es de todos!',
            reverse: true
        },
        {
            img: '/icons/bud_angry.png',
            name: 'El Campanero',
            desc: '¡Pilas pues! Reporta cualquier visaje extraño. Mantiene la zona nítida y si alguien se pasa de pirobo o ensucia el sitio, le canta la jugada de una. ¡Respeto por el spot!',
        },
        {
            img: '/icons/bud_police.png',
            name: 'Maritombo',
            desc: '¡Ojo que viene el azote! Le zumba cuando la ley anda cerca. Si ve una patrulla o el parche se calentó, le avisa en tiempo real para que se abra antes del visaje. ¡Camine por la sombra!',
            reverse: true
        }
    ];

    return (
        <div className={`about-page ${darkMode ? '' : 'light'}`}>

            {/* ═══ HERO ═══ */}
            <div className="about-hero">
                <div className="about-hero-logo">
                    <img src="/icons/relax_marker.png" alt="WhereToSmoke Logo" />
                </div>
                <h1 className="about-hero-title">WhereToSmoke</h1>
                <p className="about-hero-subtitle">
                    La comunidad de Medellín para encontrar y compartir los mejores spots, con alertas en tiempo real y mucho más.
                </p>
            </div>

            {/* ═══ STATS ═══ */}
            <div className="about-stats">
                <div className="about-stat">
                    <div className="about-stat-value">{stats.spots}</div>
                    <div className="about-stat-label">Spots</div>
                </div>
                <div className="about-stat">
                    <div className="about-stat-value">{stats.usuarios}</div>
                    <div className="about-stat-label">Usuarios</div>
                </div>
                <div className="about-stat">
                    <div className="about-stat-value">{stats.fotos}</div>
                    <div className="about-stat-label">Fotos</div>
                </div>
            </div>

            {/* ═══ PERSONAJES EN FILA ═══ */}
            <div className="about-characters-banner">
                <div className="about-character-item">
                    <img src="/icons/bud_smoking.png" alt="El Relax" />
                </div>
                <div className="about-character-item">
                    <img src="/icons/bud_map.png" alt="El Explorador" />
                </div>
                <div className="about-character-item">
                    <img src="/icons/bud_angry.png" alt="El Guardia" />
                </div>
                <div className="about-character-item">
                    <img src="/icons/bud_police.png" alt="El Vigía" />
                </div>
            </div>
            <p className="about-characters-label">Conoce al equipo 🌿</p>

            {/* ═══ VALUES ═══ */}
            <div className="about-section">
                <h2 className="about-section-title">
                    <HiHeart size={20} /> Nuestros Valores
                </h2>
                <div className="about-values">
                    {values.map((value, index) => (
                        <div key={index} className="about-value-card" style={{ animationDelay: `${index * 0.08}s` }}>
                            <div className="about-value-icon">
                                {value.icon}
                            </div>
                            <div className="about-value-content">
                                <h3 className="about-value-title">{value.title}</h3>
                                <p className="about-value-desc">{value.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="about-divider" />

            {/* ═══ PERSONAJES SPOTLIGHT — cada uno con su historia ═══ */}
            <div className="about-section">
                <h2 className="about-section-title">
                    <HiSparkles size={20} /> Conoce al Equipo
                </h2>

                {characters.map((char, index) => (
                    <div
                        key={index}
                        className={`about-char-spotlight ${char.reverse ? 'reverse' : ''}`}
                        style={{ animationDelay: `${index * 0.1}s`, marginBottom: '12px' }}
                    >
                        <div className="about-char-spotlight-img">
                            <img src={char.img} alt={char.name} />
                        </div>
                        <div className="about-char-spotlight-text">
                            <h3>{char.name}</h3>
                            <p>{char.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="about-divider" />

            {/* ═══ FUNCIONALIDADES ═══ */}
            <div className="about-section">
                <h2 className="about-section-title">
                    <HiStar size={20} /> Funcionalidades
                </h2>
                <div className="about-values">
                    {features.map((feature, index) => (
                        <div key={index} className="about-value-card" style={{ animationDelay: `${index * 0.05}s` }}>
                            <div className="about-value-icon">
                                {feature.icon}
                            </div>
                            <div className="about-value-content">
                                <h3 className="about-value-title">{feature.title}</h3>
                                <p className="about-value-desc">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="about-footer">
                <p className="about-footer-text">
                    Hecho con <HiHeart size={12} style={{ verticalAlign: 'middle', color: '#F44336' }} /> en <span className="about-footer-brand">Medellín</span>
                </p>
                <p className="about-footer-text" style={{ marginTop: '6px' }}>
                    WhereToSmoke v1.0 &copy; 2026
                </p>
            </div>
        </div>
    );
};

export default AboutPage;
