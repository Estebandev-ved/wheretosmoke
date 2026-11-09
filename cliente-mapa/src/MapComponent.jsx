import { API_BASE, WS_URL } from './config';
import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline, CircleMarker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { useToast } from './components/WeedToast';
import { useParticles } from './components/ParticleEffects';
import { useGlobalSound } from './context/SoundContext';
import { useGlobalAchievements } from './context/AchievementContext';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Componentes
import MapHUD from './components/MapHUD';
import SpotCard from './components/SpotCard';
import { markBoot } from './services/bootStatus';
import AuthModal from './components/AuthModal';
import PanicButton from './components/PanicButton';
import GeoZones from './components/GeoZones';
import TrustCircles from './components/TrustCircles';
import GeoChat from './components/GeoChat';
import RouteCalculator from './components/RouteCalculator';
// import MedellinCityBorder from './components/MedellinCityBorder';
import { useAuth } from './context/AuthContext';

// Lazy loading de componentes pesados
const SpotDetailModal = lazy(() => import('./components/SpotDetailModal'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const SpotsSugeridos = lazy(() => import('./components/SpotsSugeridos'));

// --- CONFIGURACIÓN DE ÍCONOS ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// 1. ÍCONO VERDE (RELAX - Green Bud)
const greenIcon = new L.Icon({
    iconUrl: '/icons/relax_marker.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [50, 60],
    iconAnchor: [25, 60],
    popupAnchor: [0, -60],
    shadowSize: [41, 41]
});

// 2. ÍCONO ROJO (TOMBO - Red Bud with Siren)
const redIcon = new L.Icon({
    iconUrl: '/icons/tombo_marker.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [50, 60],
    iconAnchor: [25, 60],
    popupAnchor: [0, -60],
    shadowSize: [41, 41]
});

// 3. ÍCONO AZUL (User Location - Blue Bud with Pulse)
const blueIcon = new L.Icon({
    iconUrl: '/icons/user_location.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [60, 72],
    iconAnchor: [30, 72],
    popupAnchor: [0, -72],
    shadowSize: [41, 41]
});

// 4. ÍCONO POR DEFECTO
let DefaultIcon = L.icon({
    iconUrl: '/icons/relax_marker.png',
    shadowUrl: iconShadow,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- COMPONENTE PARA DETECTAR CLICS CON VALIDACIÓN DE ZONA ---
function ClickHandler({ alHacerClick, toast, routeMode }) {
    useMapEvents({
        click: async (e) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            // 🛣️ Si estamos en modo ruta, enviar clic al RouteCalculator
            if (routeMode > 0 && window.handleRouteMapClick) {
                window.handleRouteMapClick({ lat, lng });
                return;
            }

            // 🗺️ Validar límites de Medellín
            if (lat < 6.1 || lat > 6.4 || lng < -75.7 || lng > -75.5) {
                toast.error("🚫 Solo puedes marcar spots en Medellín");
                return;
            }

            // 🚧 Validar zona activa (Backend)
            try {
                const { data } = await axios.post(`${API_BASE}/geozonas/validar`, { lat, lng });

                if (!data.permitido) {
                    toast.warning(data.mensaje);
                    return;
                }

                // ✅ Todo OK, permitir crear spot
                alHacerClick(e.latlng);

            } catch (error) {
                console.error('Error validando zona:', error);
                toast.error("❌ Error validando ubicación");
            }
        },
    });
    return null;
}

// --- COMPONENTE PARA CAPTURAR LA REFERENCIA DEL MAPA ---
function MapReference({ mapRef }) {
    const map = useMap();
    useEffect(() => {
        if (map) {
            mapRef.current = map;
        }
    }, [map, mapRef]);
    return null;
}

// 📏 Calcular distancia entre dos puntos (en metros)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

const MapComponent = ({ darkMode, setDarkMode }) => {
    const [spots, setSpots] = useState([]);
    const [nuevoSpot, setNuevoSpot] = useState(null);
    const [formNombre, setFormNombre] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formCategoria, setFormCategoria] = useState('PARQUE'); // 🎯 Categoría por defecto

    const [userFingerprint, setUserFingerprint] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const mapRef = useRef(null);

    // Estados para filtros (darkMode viene por props)
    const [filter, setFilter] = useState('ALL');

    // 🔐 Estado para modal de auth
    const [showAuthModal, setShowAuthModal] = useState(false);

    // 📍 Estado para modal de detalle de spot
    const [selectedSpot, setSelectedSpot] = useState(null);

    // 🃏 Spot mostrado en la tarjeta inferior (por id, para que los votos se refresquen solos)
    const [cardSpotId, setCardSpotId] = useState(null);

    // 🏆 Estado para leaderboard
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // 👤 Estado para perfil de usuario
    const [showUserProfile, setShowUserProfile] = useState(false);

    // 🔥 Estado para spots sugeridos
    const [showSugeridos, setShowSugeridos] = useState(false);

    // 👥 Estado para círculos de confianza
    const [showTrustCircles, setShowTrustCircles] = useState(false);

    // 💬 Estado para geochat
    const [showGeoChat, setShowGeoChat] = useState(false);
    const [chatSpot, setChatSpot] = useState(null);

    // 🛣️ Estado para rutas
    const [showRouteCalculator, setShowRouteCalculator] = useState(false);
    const [calculatedRoute, setCalculatedRoute] = useState(null);
    const [routeMode, setRouteMode] = useState(0); // 0=inactivo, 1=origen, 2=destino
    const [routeDestino, setRouteDestino] = useState(null); // spot elegido como destino desde su tarjeta
    const [simulationPosition, setSimulationPosition] = useState(null); // Posición actual del coche 🚘
    const [simulationIndex, setSimulationIndex] = useState(0); // Índice de ruta actual
    const [simulationAngle, setSimulationAngle] = useState(0); // Ángulo de rotación del coche

    // 📡 WebSocket
    const stompClient = useRef(null);

    // 🎨 Visual Effects Hooks
    const toast = useToast();
    const particles = useParticles();
    const { sounds } = useGlobalSound();
    const { updateProgress } = useGlobalAchievements();

    const { isAuthenticated, token } = useAuth();

    const API_URL = `${API_BASE}/spots`;

    // 🔑 Generar fingerprint
    useEffect(() => {
        const obtenerFingerprint = async () => {
            try {
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                setUserFingerprint(result.visitorId);
                console.log('🔑 Fingerprint generado:', result.visitorId);
            } catch (error) {
                console.error('Error generando fingerprint:', error);
                setUserFingerprint('fallback-' + Math.random().toString(36).substr(2, 9));
            }
        };
        obtenerFingerprint();
    }, []);

    //  Centrar mapa en ubicación del usuario al iniciar
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(coords);
                if (mapRef.current) {
                    mapRef.current.setView(coords, 15);
                }
            },
            (error) => {
                console.log('No se pudo obtener ubicación:', error);
            }
        );
    }, []);

    // 📡 CONECTAR WEBSOCKET para alertas en tiempo real
    useEffect(() => {
        // El backend exige JWT en el CONNECT de STOMP
        if (!localStorage.getItem('token')) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            beforeConnect: () => {
                client.connectHeaders = {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                };
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('📡 WebSocket conectado');

            // Suscribirse a alertas
            client.subscribe('/topic/alerts', (message) => {
                const alerta = JSON.parse(message.body);
                console.log(' Alerta recibida:', alerta);

                // Calcular distancia si tenemos ubicación
                if (userLocation && alerta.latitud && alerta.longitud) {
                    const distancia = calcularDistancia(
                        userLocation[0], userLocation[1],
                        alerta.latitud, alerta.longitud
                    );

                    if (distancia < 1000) { // Menos de 1km
                        if (alerta.tipoAlerta === 'TOMBO') {
                            toast.error(` ¡ALERTA CERCA! ${alerta.spotNombre} (${Math.round(distancia)}m)`, {
                                autoClose: 10000
                            });
                        } else {
                            toast.success(` Zona despejada: ${alerta.spotNombre}`, {
                                autoClose: 5000
                            });
                        }
                    }
                }

                // Recargar spots para ver el cambio
                fetchSpots();
            });
        };

        client.onStompError = (frame) => {
            console.error('Error STOMP:', frame);
        };

        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
        };
    }, [userLocation]);

    // 🔄 Cargar spots
    const fetchSpots = async () => {
        try {
            const response = await axios.get(`${API_URL}?fingerprint=${userFingerprint}`);
            setSpots(response.data);
        } catch (error) {
            console.error("Error cargando spots:", error);
        } finally {
            markBoot('spots');
        }
    };

    useEffect(() => {
        markBoot('map');
    }, []);

    useEffect(() => {
        if (userFingerprint) {
            fetchSpots();
        }
    }, [userFingerprint]);

    // 🗳️ Manejar reportes
    const handleReporte = async (id, tipo) => {
        try {
            const endpoint = tipo === 'tombo'
                ? `${API_URL}/${id}/tombo?fingerprint=${userFingerprint}`
                : `${API_URL}/${id}/relax?fingerprint=${userFingerprint}`;

            const response = await axios.post(endpoint);
            const resultado = response.data;

            if (resultado.usuarioYaVoto) {
                toast.warning("⚠️ ¡Ya rotaste el voto aquí, parcero!");
            } else {
                // Visual & Sound effects
                if (tipo === 'tombo') {
                    // 🚨 Particle effect - red smoke!
                    particles.voteTombo(window.innerWidth / 2, window.innerHeight / 2);
                    sounds.vote(); // 🔊 Vote sound
                    toast.error(`🚨 ¡Alerta enviada! ${resultado.mensajeEstado} (Ojo ahí)`);
                } else {
                    // 🌿 Particle effect - green smoke!
                    particles.voteRelax(window.innerWidth / 2, window.innerHeight / 2);
                    sounds.vote(); // 🔊 Vote sound

                    // 🏆 Achievement progress
                    updateProgress('relaxVotes', 1);

                    toast.success(`🥦 ¡Buena esa! ${resultado.mensajeEstado} (A disfrutar)`);
                }
            }

            fetchSpots();
        } catch (error) {
            toast.error("❌ Error conectando con el servidor");
            console.error(error);
        }
    };

    // 📍 Ir a mi ubicación
    const irAMiUbicacion = () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(coords);

                if (mapRef.current) {
                    mapRef.current.setView(coords, 16);
                }

                toast.info("📍 ¡Te encontramos!");
            },
            (error) => {
                toast.error("❌ No pudimos obtener tu ubicación. Revisa los permisos.");
                console.error(error);
            }
        );
    };

    // 💾 Guardar nuevo sitio
    const guardarSitio = async (e) => {
        e.preventDefault();
        if (!formNombre || !formDesc) {
            toast.warning("⚠️ Llena los datos parcero");
            return;
        }

        try {
            await axios.post(API_URL, {
                nombre: formNombre,
                descripcion: formDesc,
                latitud: nuevoSpot.lat,
                longitud: nuevoSpot.lng,
                estado: 'VERDE',
                categoria: formCategoria // 🎯 Categoría seleccionada
            });

            // 🎉 Particle effect - spot created!
            particles.spotCreated(window.innerWidth / 2, window.innerHeight / 2);

            // 🔊 Success sound
            sounds.success();

            // 🏆 Achievement progress
            updateProgress('spotsCreated', 1);

            toast.success("📍 ¡Nuevo Spot Creado!");
            setNuevoSpot(null);
            setFormNombre('');
            setFormDesc('');
            setFormCategoria('PARQUE'); // Reset a categoría por defecto
            fetchSpots();
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.warning("🔒 Inicia sesión para crear spots");
            } else {
                toast.error("❌ Error guardando el sitio");
            }
        }
    };

    // 🔍 FILTRAR SPOTS
    const spotsFiltrados = spots.filter((spotDTO) => {
        if (filter === 'ALL') return true;
        return spotDTO.spot.estado === filter;
    });

    const cardSpotDTO = cardSpotId != null ? spots.find((s) => s.spot.id === cardSpotId) || null : null;

    // 🎨 URL del mapa según modo oscuro o claro
    // CARTO exige API key y sin ella pinta marcas de agua "API KEY REQUIRED".
    // Usamos mosaicos de OpenStreetMap (sin clave) y el modo oscuro se logra con un filtro CSS.
    // Para producción define VITE_TILE_URL con un proveedor propio (MapTiler, Stadia, etc.).
    const tileUrl = import.meta.env.VITE_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    return (
        <>
            <MapContainer
                center={[6.2505, -75.5660]} // Centro de Medellín
                zoom={14}
                style={{ height: '100vh', width: '100vw', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                maxBounds={[
                    [6.1, -75.7],  // SW (suroeste)
                    [6.4, -75.5]   // NE (noreste)
                ]}
                maxBoundsViscosity={1.0} // Restringir pan fuera de Medellín
            >
                <TileLayer
                    key={darkMode ? 'tiles-dark' : 'tiles-light'}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={tileUrl}
                    maxZoom={19}
                    className={darkMode ? 'map-tiles-dark' : 'map-tiles-light'}
                />

                {/* 📍 Componente para capturar la referencia del mapa */}
                <MapReference mapRef={mapRef} />

                {/* 🏙️ LÍMITE DE MEDELLÍN */}
                {/* <MedellinCityBorder /> */}

                {/* 🗺️ GEO-ZONAS (Polígonos de zonas activas) */}
                {/* <GeoZones /> */}

                <ClickHandler alHacerClick={setNuevoSpot} toast={toast} routeMode={routeMode} />



                {/* 📍 Marcador de tu ubicación */}
                {userLocation && (
                    <Marker position={userLocation} icon={blueIcon}>
                        <Popup>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ margin: 0 }}>📍 Tu ubicación</h4>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* 🗺️ Marcadores de Spots (FILTRADOS) */}
                {spotsFiltrados.map((spotDTO) => {
                    const spot = spotDTO.spot;
                    if (!spot.latitud || !spot.longitud) return null;

                    return (
                        <Marker
                            key={spot.id}
                            position={[spot.latitud, spot.longitud]}
                            icon={spot.estado === 'ROJO' ? redIcon : greenIcon}
                            eventHandlers={{ click: () => setCardSpotId(spot.id) }}
                        >
                        </Marker>
                    );
                })}

                {/* Marcador Temporal */}
                {nuevoSpot && <Marker position={nuevoSpot} />}

                {/* 🛣️ RUTA CALCULADA */}
                {calculatedRoute && (
                    <>
                        <Polyline
                            positions={calculatedRoute.ruta.map(p => [p.latitud, p.longitud])}
                            pathOptions={{
                                color: calculatedRoute.reportesCercanos > 0 ? '#FF9800' : '#2196F3',
                                weight: 6,
                                opacity: 0.8,
                                lineCap: 'round',
                                lineJoin: 'round',
                                dashArray: calculatedRoute.reportesCercanos > 2 ? '10, 10' : null
                            }}
                        />

                        {/* Marcadores para reportes peligrosos en la ruta */}
                        {calculatedRoute.reportes.map((reporte, idx) => (
                            <CircleMarker
                                key={`reporte-${idx}`}
                                center={[reporte.latitud, reporte.longitud]}
                                radius={15}
                                pathOptions={{
                                    color: '#F44336',
                                    fillColor: '#F44336',
                                    fillOpacity: 0.4,
                                    weight: 1
                                }}
                            >
                                <Popup>
                                    <div style={{ textAlign: 'center' }}>
                                        <b style={{ color: '#d32f2f' }}>🚨 REPORTE POLICIAL</b><br />
                                        {reporte.tipo}<br />
                                        <small>{new Date(reporte.timestamp).toLocaleTimeString()}</small>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}

                        {/* Origen y Destino */}
                        <CircleMarker
                            center={[calculatedRoute.ruta[0].latitud, calculatedRoute.ruta[0].longitud]}
                            radius={8}
                            pathOptions={{ color: 'white', fillColor: '#2196F3', fillOpacity: 1, weight: 2 }}
                        />
                        <CircleMarker
                            center={[
                                calculatedRoute.ruta[calculatedRoute.ruta.length - 1].latitud,
                                calculatedRoute.ruta[calculatedRoute.ruta.length - 1].longitud
                            ]}
                            radius={8}
                            pathOptions={{ color: 'white', fillColor: '#4CAF50', fillOpacity: 1, weight: 2 }}
                        />

                        {/* 🚘 MARCADOR SIMULACIÓN EN TIEMPO REAL */}
                        {simulationPosition && (
                            <Marker
                                position={simulationPosition}
                                icon={L.divIcon({
                                    className: 'simulation-car',
                                    html: `<div style="
                                        font-size: 2rem; 
                                        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                                        transform: rotate(${simulationAngle || 0}deg);
                                        transition: transform 0.5s ease;
                                    ">🚘</div>`,
                                    iconSize: [40, 40],
                                    iconAnchor: [20, 20]
                                })}
                                zIndexOffset={1000}
                            />
                        )}
                    </>
                )}
            </MapContainer>

{/* 🎮 HUD DEL MAPA (busqueda, chips, filtros, acciones) */}
            <MapHUD
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                mapRef={mapRef}
                filter={filter}
                setFilter={setFilter}
                counts={{
                    total: spots.length,
                    tombo: spots.filter((s) => s.spot.estado === 'ROJO').length,
                    relax: spots.filter((s) => s.spot.estado === 'VERDE').length,
                }}
                onLocate={irAMiUbicacion}
                onToggleCircles={() => setShowTrustCircles(!showTrustCircles)}
                onToggleRoutes={() => { setRouteDestino(null); setShowRouteCalculator(!showRouteCalculator); }}
                circlesActive={showTrustCircles}
                routesActive={showRouteCalculator}
                onLoginClick={() => setShowAuthModal(true)}
                onProfileClick={() => setShowUserProfile(true)}
            />

            {/* 📍 TARJETA DEL SPOT SELECCIONADO */}
            {cardSpotDTO && (
                <SpotCard
                    spotDTO={cardSpotDTO}
                    distanciaM={userLocation && cardSpotDTO.spot.latitud
                        ? calcularDistancia(userLocation[0], userLocation[1], cardSpotDTO.spot.latitud, cardSpotDTO.spot.longitud)
                        : null}
                    onClose={() => setCardSpotId(null)}
                    onVote={handleReporte}
                    onRoute={() => {
                        const sp = cardSpotDTO.spot;
                        setRouteDestino({ lat: sp.latitud, lng: sp.longitud, nombre: sp.nombre });
                        setShowTrustCircles(false);
                        setShowRouteCalculator(true);
                        setCardSpotId(null);
                    }}
                    onDetail={() => setSelectedSpot(cardSpotDTO.spot)}
                    onChat={() => {
                        setChatSpot(cardSpotDTO.spot);
                        setShowGeoChat(true);
                    }}
                />
            )}

            {/* 🔐 MODAL DE AUTENTICACIÓN */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                darkMode={darkMode}
            />

            {/* 📝 FORMULARIO FLOTANTE */}
            {nuevoSpot && (
                <div style={{
                    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: darkMode ? '#2c2c2c' : 'white',
                    color: darkMode ? 'white' : '#333',
                    padding: '20px', borderRadius: '15px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 1000, width: '90%', maxWidth: '400px'
                }}>
                    <h3 style={{ marginTop: 0 }}>Nuevo Spot 📍</h3>
                    <form onSubmit={guardarSitio}>
                        <input
                            type="text" placeholder="Nombre del lugar"
                            value={formNombre} onChange={e => setFormNombre(e.target.value)}
                            style={{
                                width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px',
                                border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                                backgroundColor: darkMode ? '#3c3c3c' : 'white',
                                color: darkMode ? 'white' : '#333',
                                boxSizing: 'border-box'
                            }}
                        />
                        <textarea
                            placeholder="Descripción"
                            value={formDesc} onChange={e => setFormDesc(e.target.value)}
                            style={{
                                width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px',
                                border: `1px solid ${darkMode ? '#555' : '#ddd'}`, minHeight: '60px',
                                backgroundColor: darkMode ? '#3c3c3c' : 'white',
                                color: darkMode ? 'white' : '#333',
                                boxSizing: 'border-box'
                            }}
                        />

                        {/* 🎯 CATEGORÍA */}
                        <select
                            value={formCategoria}
                            onChange={e => setFormCategoria(e.target.value)}
                            style={{
                                width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px',
                                border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                                backgroundColor: darkMode ? '#3c3c3c' : 'white',
                                color: darkMode ? 'white' : '#333',
                                boxSizing: 'border-box',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="PARQUE"> Parque público</option>
                            <option value="MIRADOR"> Mirador</option>
                            <option value="ROOF">Roof/Terraza</option>
                            <option value="NATURALEZA"> Naturaleza</option>
                            <option value="INDOOR"> Indoor</option>
                            <option value="CALLEJON"> Callejón</option>
                            <option value="OTRO"> Otro</option>
                        </select>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={() => setNuevoSpot(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ccc', cursor: 'pointer', color: '#333' }}>Cancelar</button>
                            <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#00C851', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 📍 MODAL DE DETALLE DE SPOT */}
            {selectedSpot && (
                <SpotDetailModal
                    spot={selectedSpot}
                    darkMode={darkMode}
                    onClose={() => setSelectedSpot(null)}
                    onFavoriteChange={fetchSpots}
                />
            )}

            {/* 🏆 LEADERBOARD */}
            <Leaderboard
                darkMode={darkMode}
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
            />

            {/* 👤 PERFIL DE USUARIO */}
            <UserProfile
                darkMode={darkMode}
                isOpen={showUserProfile}
                onClose={() => setShowUserProfile(false)}
            />

            {/* 🔥 SPOTS SUGERIDOS */}
            <SpotsSugeridos
                darkMode={darkMode}
                isOpen={showSugeridos}
                onClose={() => setShowSugeridos(false)}
                onSpotClick={(spot) => {
                    setShowSugeridos(false);

                    // 🛡️ Verificar que el spot tenga coordenadas válidas
                    if (!spot || !spot.latitud || !spot.longitud) {
                        console.error('❌ Spot sin coordenadas válidas:', spot);
                        return;
                    }

                    setSelectedSpot(spot);
                    if (mapRef.current) {
                        mapRef.current.setView([spot.latitud, spot.longitud], 16);
                    }
                }}
                userLocation={userLocation}
            />

            {/* 🚨 BOTÓN DE PÁNICO */}
            <PanicButton darkMode={darkMode} />

            {/* 👥 CÍRCULOS DE CONFIANZA (hoja inferior) */}
            {showTrustCircles && (
                <TrustCircles
                    userLocation={userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null}
                    onClose={() => setShowTrustCircles(false)}
                    onLogin={() => { setShowTrustCircles(false); setShowAuthModal(true); }}
                    onCircleMembersUpdate={(members) => {
                        console.log('Miembros actualizados:', members);
                    }}
                />
            )}

            {/* 💬 PANEL GEOCHAT */}
            {showGeoChat && chatSpot && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000,
                    animation: 'slideIn 0.3s ease'
                }}>
                    <GeoChat
                        spot={chatSpot}
                        userLocation={userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null}
                        onClose={() => {
                            setShowGeoChat(false);
                            setChatSpot(null);
                        }}
                    />
                </div>
            )}

            {/* 🛣️ RUTA DE BAJO PERFIL (hoja inferior) */}
            {showRouteCalculator && (
                <RouteCalculator
                    userLocation={userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null}
                    destinoSpot={routeDestino}
                    rutaInicial={calculatedRoute}
                    spots={spots.map((s) => ({ id: s.spot.id, nombre: s.spot.nombre, lat: s.spot.latitud, lng: s.spot.longitud }))}
                    onRouteCalculated={(route) => {
                        setCalculatedRoute(route);
                        if (!route) {
                            setSimulationPosition(null);
                            return;
                        }
                        if (mapRef.current && route.ruta?.length > 1) {
                            mapRef.current.fitBounds(route.ruta.map((p) => [p.latitud, p.longitud]), {
                                paddingTopLeft: [30, 190], paddingBottomRight: [30, 400], maxZoom: 17,
                            });
                        }
                    }}
                    onModeChange={setRouteMode}
                    onSimulationStart={(ruta) => {
                        if (!ruta || ruta.ruta.length === 0) return;
                        setSimulationIndex(0);
                        setSimulationPosition([ruta.ruta[0].latitud, ruta.ruta[0].longitud]);
                        toast.success("▶️ Iniciando simulación de ruta...");
                    }}
                    onClose={() => { setShowRouteCalculator(false); setRouteDestino(null); }}
                />
            )}
        </>
    );
};

export default MapComponent;