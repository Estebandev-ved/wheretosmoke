import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';

/**
 * 📸 COMPONENTE DE SUBIDA DE FOTOS
 * 
 * Permite seleccionar, previsualizar y subir fotos
 */
const PhotoUploader = ({
    darkMode = false,
    onUpload = () => { },
    maxSizeKB = 500
}) => {
    const [preview, setPreview] = useState(null);
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Verificar tipo
        if (!file.type.startsWith('image/')) {
            toast.error('❌ Solo se permiten imágenes');
            return;
        }

        // Verificar tamaño
        const sizeKB = file.size / 1024;
        if (sizeKB > maxSizeKB * 2) {
            toast.warning(`⚠️ Imagen muy grande (${Math.round(sizeKB)}KB). Se redimensionará.`);
        }

        // Leer y redimensionar
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDim = 800;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height / width) * maxDim;
                        width = maxDim;
                    } else {
                        width = (width / height) * maxDim;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                setPreview(resizedBase64);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!preview) {
            toast.warning('⚠️ Selecciona una foto primero');
            return;
        }

        setLoading(true);
        try {
            await onUpload(preview, descripcion);
            setPreview(null);
            setDescripcion('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            toast.error('❌ Error subiendo foto');
        }
        setLoading(false);
    };

    const cancelar = () => {
        setPreview(null);
        setDescripcion('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const styles = {
        container: {
            backgroundColor: darkMode ? '#2c2c2c' : '#f5f5f5',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '15px'
        },
        input: {
            display: 'none'
        },
        selectButton: {
            width: '100%',
            padding: '40px 20px',
            border: `2px dashed ${darkMode ? '#555' : '#ccc'}`,
            borderRadius: '10px',
            backgroundColor: 'transparent',
            color: darkMode ? '#888' : '#666',
            cursor: 'pointer',
            fontSize: '16px',
            textAlign: 'center'
        },
        preview: {
            width: '100%',
            maxHeight: '200px',
            objectFit: 'cover',
            borderRadius: '10px',
            marginBottom: '10px'
        },
        textarea: {
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
            backgroundColor: darkMode ? '#3c3c3c' : 'white',
            color: darkMode ? 'white' : '#333',
            marginBottom: '10px',
            resize: 'none',
            boxSizing: 'border-box'
        },
        buttonRow: {
            display: 'flex',
            gap: '10px'
        },
        cancelButton: {
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#666',
            color: 'white',
            cursor: 'pointer'
        },
        uploadButton: {
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#00C851',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: loading ? 0.7 : 1
        }
    };

    return (
        <div style={styles.container}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={styles.input}
            />

            {!preview ? (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={styles.selectButton}
                >
                    📸 Toca para seleccionar foto
                </button>
            ) : (
                <>
                    <img src={preview} alt="Preview" style={styles.preview} />
                    <textarea
                        placeholder="Descripción (opcional)"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        style={styles.textarea}
                        rows={2}
                    />
                    <div style={styles.buttonRow}>
                        <button onClick={cancelar} style={styles.cancelButton}>
                            Cancelar
                        </button>
                        <button onClick={handleUpload} style={styles.uploadButton} disabled={loading}>
                            {loading ? '...' : '📤 Subir'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default PhotoUploader;
