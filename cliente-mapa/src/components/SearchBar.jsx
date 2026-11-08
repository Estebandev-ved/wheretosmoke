import React, { useState } from 'react';
import axios from 'axios';
import { HiSun, HiMoon, HiMagnifyingGlass } from 'react-icons/hi2';

/**
 * 🔍 BARRA DE BÚSQUEDA (Rediseño Premium)
 * 
 * Input flotante con glassmorphism y resultados animados
 * Incluye Toggle de Modo Oscuro al lado
 */
const SearchBar = ({ darkMode, setDarkMode, onLocationSelect, mapRef, embedded = false }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // 🔍 Buscar lugares con Nominatim API
    const buscar = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Medellín&format=json&limit=5`,
                {
                    headers: {
                        'User-Agent': 'WhereToSmoke/1.0'
                    }
                }
            );
            setResults(response.data);
            setShowResults(true);
        } catch (error) {
            console.error('Error buscando:', error);
        }
        setIsSearching(false);
    };

    // 📍 Seleccionar un resultado y mover el mapa
    const seleccionarLugar = (lugar) => {
        const lat = parseFloat(lugar.lat);
        const lon = parseFloat(lugar.lon);

        if (mapRef?.current) {
            mapRef.current.setView([lat, lon], 17);
        }

        if (onLocationSelect) {
            onLocationSelect([lat, lon]);
        }

        setShowResults(false);
        setQuery(lugar.display_name.split(',')[0]);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            buscar();
        }
    };

    const isMobile = window.innerWidth <= 768;

    const styles = {
        container: embedded ? {
            // Dentro del MapHUD: el HUD controla posicion y ancho
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
        } : {
            position: 'absolute',
            top: isMobile ? '15px' : '20px',
            left: isMobile ? '16px' : '20px',
            zIndex: 1000,
            width: 'min(380px, calc(100vw - 32px))',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
        },
        inputWrapper: {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: embedded ? 'var(--glass)' : (darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)'),
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: embedded ? '1px solid var(--border-subtle)' : `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            padding: '4px 4px 4px 16px',
            boxShadow: embedded ? 'var(--elev-1)' : '0 4px 20px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease'
        },
        toggleBtn: {
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            backgroundColor: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: darkMode ? '#FFD700' : '#555',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
            flexShrink: 0
        },
        input: {
            flex: 1,
            border: 'none',
            fontSize: '16px',
            outline: 'none',
            backgroundColor: 'transparent',
            color: embedded ? 'var(--text)' : (darkMode ? 'white' : '#333'),
            minWidth: 0,
            fontWeight: '500'
        },
        searchBtn: {
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: embedded ? 'var(--accent)' : '#00C851',
            color: embedded ? '#04140A' : 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 10px rgba(0,200,81,0.3)'
        },
        resultsList: {
            position: 'absolute',
            top: '56px',
            left: 0,
            right: (isMobile || embedded || !setDarkMode) ? 0 : '58px',
            backgroundColor: embedded ? 'var(--surface)' : (darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s ease backwards',
            zIndex: 1001
        },
        resultItem: {
            padding: '12px 16px',
            borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
        },
        resultName: {
            fontWeight: '600',
            fontSize: '14px',
            color: darkMode ? 'white' : '#333',
            marginBottom: '2px'
        },
        resultDesc: {
            fontSize: '12px',
            color: darkMode ? '#888' : '#666',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        empty: {
            padding: '20px',
            textAlign: 'center',
            color: darkMode ? '#888' : '#666',
            fontSize: '13px'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.inputWrapper}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar lugar en Medellín..."
                    aria-label="Buscar lugar"
                    style={styles.input}
                />
                <button
                    onClick={buscar}
                    disabled={isSearching}
                    style={styles.searchBtn}
                    aria-label="Buscar"
                >
                    {isSearching ? <span className="animate-spin">⌛</span> : <HiMagnifyingGlass size={20} />}
                </button>
            </div>

            {/* 🌓 Botón Toggle Modo Oscuro (Al lado de la 'lunea'/lupa) */}
            {setDarkMode && (
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    style={styles.toggleBtn}
                    title="Cambiar modo"
                    aria-label="Cambiar modo claro u oscuro"
                >
                    {darkMode ? <HiSun /> : <HiMoon />}
                </button>
            )}

            {showResults && (
                <div style={styles.resultsList}>
                    {results.length > 0 ? (
                        results.map((lugar, index) => (
                            <div
                                key={index}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') seleccionarLugar(lugar); }}
                                onClick={() => seleccionarLugar(lugar)}
                                style={styles.resultItem}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={styles.resultName}>
                                    📍 {lugar.display_name.split(',')[0]}
                                </div>
                                <div style={styles.resultDesc}>
                                    {lugar.display_name}
                                </div>
                            </div>
                        ))
                    ) : (
                        !isSearching && (
                            <div style={styles.empty}>
                                No se encontraron resultados
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
