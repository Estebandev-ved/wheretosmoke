import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './zona-editor.css';

/**
 * 🗺️ EDITOR GRÁFICO DE ZONAS
 * 
 * Modal con mapa interactivo para crear zonas dibujando polígonos
 */

// Ícono para los vértices
const vertexIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Componente para capturar clicks en el mapa
function ClickHandler({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        }
    });
    return null;
}

const ZonaEditor = ({ isOpen, onClose, onSave }) => {
    const { token } = useAuth();
    const [vertices, setVertices] = useState([]);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [color, setColor] = useState('#00C851');
    const [tipo, setTipo] = useState('COMUNA');
    const [saving, setSaving] = useState(false);

    const handleMapClick = (latlng) => {
        // Agregar nuevo vértice
        setVertices([...vertices, [latlng.lat, latlng.lng]]);
    };

    const handleUndo = () => {
        // Quitar último vértice
        setVertices(vertices.slice(0, -1));
    };

    const handleClear = () => {
        // Limpiar todo
        setVertices([]);
    };

    const handleSave = async () => {
        if (vertices.length < 3) {
            alert('Necesitas al menos 3 puntos para crear un polígono');
            return;
        }

        if (!nombre.trim()) {
            alert('Debes ingresar un nombre para la zona');
            return;
        }

        setSaving(true);

        try {
            // Cerrar el polígono (último punto = primer punto)
            const closedPolygon = [...vertices, vertices[0]];

            // Convertir a formato GeoJSON [lng, lat]
            const coordinates = closedPolygon.map(v => [v[1], v[0]]);

            const geoJson = {
                type: "Polygon",
                coordinates: [coordinates]
            };

            const zonaData = {
                nombre: nombre.trim(),
                tipo: tipo,
                poligonoJson: JSON.stringify(geoJson),
                activa: false, // Por defecto inactiva
                color: color,
                descripcion: descripcion.trim(),
                orden: 99 // Se puede ajustar después
            };

            console.log('📤 Enviando zona:', zonaData);

            const { data } = await axios.post(
                'http://localhost:8081/api/admin/geozonas',
                zonaData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✅ Zona creada:', data);

            // Limpiar y cerrar
            setVertices([]);
            setNombre('');
            setDescripcion('');
            alert('✅ Zona creada exitosamente!');
            onSave(data);
            onClose();

        } catch (error) {
            console.error('❌ Error completo:', error);
            console.error('❌ Response:', error.response?.data);

            let errorMsg = 'Error al guardar la zona';

            if (error.response) {
                // Error del servidor
                if (error.response.status === 401) {
                    errorMsg = '🔒 No autorizado. Por favor inicia sesión nuevamente.';
                } else if (error.response.status === 403) {
                    errorMsg = '🚫 No tienes permisos de administrador.';
                } else if (error.response.data?.message) {
                    errorMsg = error.response.data.message;
                } else {
                    errorMsg = `Error ${error.response.status}: ${error.response.statusText}`;
                }
            } else if (error.request) {
                errorMsg = '📡 No se pudo conectar con el servidor. Verifica que esté corriendo.';
            }

            alert(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="zona-editor-modal">
            <div className="zona-editor-container">
                {/* Header */}
                <div className="zona-editor-header">
                    <h2>🗺️ Crear Nueva Zona</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                {/* Contenido principal */}
                <div className="zona-editor-content">
                    {/* Formulario lateral */}
                    <div className="zona-form">
                        <div className="form-group">
                            <label>Nombre de la Zona *</label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: El Poblado"
                                maxLength={50}
                            />
                        </div>

                        <div className="form-group">
                            <label>Tipo</label>
                            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                                <option value="COMUNA">Comuna</option>
                                <option value="BARRIO">Barrio</option>
                                <option value="CORREGIMIENTO">Corregimiento</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Color</label>
                            <div className="color-picker">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                />
                                <span className="color-preview" style={{ background: color }}></span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Descripción</label>
                            <textarea
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Descripción de la zona..."
                                rows={3}
                                maxLength={200}
                            />
                        </div>

                        {/* Instrucciones */}
                        <div className="instructions">
                            <h4>📍 Instrucciones:</h4>
                            <ol>
                                <li>Haz <strong>click en el mapa</strong> para agregar puntos</li>
                                <li>Dibuja el perímetro de la zona</li>
                                <li>Mínimo <strong>3 puntos</strong></li>
                                <li>El polígono se cierra automáticamente</li>
                            </ol>
                        </div>

                        {/* Stats */}
                        <div className="drawing-stats">
                            <div className="stat">
                                <span className="label">Puntos:</span>
                                <span className="value">{vertices.length}</span>
                            </div>
                            <div className={`stat ${vertices.length >= 3 ? 'valid' : 'invalid'}`}>
                                <span className="label">Estado:</span>
                                <span className="value">
                                    {vertices.length >= 3 ? '✅ Válido' : '⚠️ Incompleto'}
                                </span>
                            </div>
                        </div>

                        {/* Botones de control */}
                        <div className="drawing-controls">
                            <button
                                className="btn-undo"
                                onClick={handleUndo}
                                disabled={vertices.length === 0}
                            >
                                ↶ Deshacer
                            </button>
                            <button
                                className="btn-clear"
                                onClick={handleClear}
                                disabled={vertices.length === 0}
                            >
                                🗑️ Limpiar
                            </button>
                        </div>
                    </div>

                    {/* Mapa */}
                    <div className="zona-map">
                        <MapContainer
                            center={[6.2505, -75.5660]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; OpenStreetMap'
                            />

                            <ClickHandler onMapClick={handleMapClick} />

                            {/* Marcadores de vértices */}
                            {vertices.map((vertex, idx) => (
                                <Marker
                                    key={idx}
                                    position={vertex}
                                    icon={vertexIcon}
                                />
                            ))}

                            {/* Polígono preview */}
                            {vertices.length >= 3 && (
                                <Polygon
                                    positions={vertices}
                                    pathOptions={{
                                        color: color,
                                        fillColor: color,
                                        fillOpacity: 0.3,
                                        weight: 3
                                    }}
                                />
                            )}
                        </MapContainer>

                        {/* Overlay de ayuda */}
                        {vertices.length === 0 && (
                            <div className="map-help-overlay">
                                <div className="help-content">
                                    <div className="help-icon">🖱️</div>
                                    <p>Haz click en el mapa para empezar a dibujar</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer con botones */}
                <div className="zona-editor-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="btn-save"
                        onClick={handleSave}
                        disabled={vertices.length < 3 || !nombre.trim() || saving}
                    >
                        {saving ? '⏳ Guardando...' : '💾 Guardar Zona'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ZonaEditor;
