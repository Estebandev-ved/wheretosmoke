import React from 'react';

/**
 * 📊 HISTORIAL DE ALERTAS
 * 
 * Muestra timeline de alertas pasadas y patrones
 */
const AlertHistory = ({
    historial = [],
    patrones = null,
    darkMode = false
}) => {
    const diasNombre = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const formatearFecha = (timestamp) => {
        const fecha = new Date(timestamp);
        const hoy = new Date();
        const diff = hoy - fecha;
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (dias === 0) {
            return `Hoy ${fecha.getHours()}:${String(fecha.getMinutes()).padStart(2, '0')}`;
        } else if (dias === 1) {
            return `Ayer ${fecha.getHours()}:${String(fecha.getMinutes()).padStart(2, '0')}`;
        } else if (dias < 7) {
            return `Hace ${dias} días`;
        } else {
            return fecha.toLocaleDateString();
        }
    };

    const styles = {
        container: {
            backgroundColor: darkMode ? '#2c2c2c' : '#f5f5f5',
            borderRadius: '10px',
            padding: '15px'
        },
        title: {
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: darkMode ? 'white' : '#333'
        },
        patrones: {
            backgroundColor: darkMode ? '#3c3c3c' : '#fff3cd',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '13px'
        },
        patronesText: {
            color: darkMode ? '#ffc107' : '#856404',
            margin: 0
        },
        timeline: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
        },
        item: (tipo) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: tipo === 'TOMBO'
                ? (darkMode ? 'rgba(255,68,68,0.2)' : '#ffebee')
                : (darkMode ? 'rgba(0,200,81,0.2)' : '#e8f5e9')
        }),
        icon: {
            fontSize: '16px'
        },
        info: {
            flex: 1,
            fontSize: '12px',
            color: darkMode ? '#ccc' : '#666'
        },
        time: {
            fontSize: '11px',
            color: darkMode ? '#888' : '#999'
        },
        empty: {
            textAlign: 'center',
            color: darkMode ? '#666' : '#999',
            padding: '20px',
            fontSize: '13px'
        },
        horasGrid: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2px',
            marginTop: '10px'
        },
        horaItem: (count, maxCount) => ({
            width: '22px',
            height: '22px',
            borderRadius: '4px',
            backgroundColor: count > 0
                ? `rgba(255,68,68,${0.2 + (count / maxCount) * 0.8})`
                : (darkMode ? '#3c3c3c' : '#eee'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            color: count > 0 ? 'white' : (darkMode ? '#666' : '#999')
        })
    };

    // Calcular máximo para normalizar colores
    const maxHora = patrones?.alertasPorHora
        ? Math.max(...Object.values(patrones.alertasPorHora), 1)
        : 1;

    return (
        <div style={styles.container}>
            <div style={styles.title}>📊 Historial de Alertas</div>

            {/* Patrones detectados */}
            {patrones?.resumen && (
                <div style={styles.patrones}>
                    <p style={styles.patronesText}>{patrones.resumen}</p>
                </div>
            )}

            {/* Heatmap de horas */}
            {patrones?.alertasPorHora && Object.keys(patrones.alertasPorHora).length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '11px', color: darkMode ? '#888' : '#999', marginBottom: '5px' }}>
                        Alertas por hora:
                    </div>
                    <div style={styles.horasGrid}>
                        {[...Array(24)].map((_, hora) => {
                            const count = patrones.alertasPorHora[hora] || 0;
                            return (
                                <div
                                    key={hora}
                                    style={styles.horaItem(count, maxHora)}
                                    title={`${hora}:00 - ${count} alertas`}
                                >
                                    {hora}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Timeline */}
            {historial.length > 0 ? (
                <div style={styles.timeline}>
                    {historial.slice(0, 10).map((alerta, index) => (
                        <div key={index} style={styles.item(alerta.tipoAlerta)}>
                            <span style={styles.icon}>
                                {alerta.tipoAlerta === 'TOMBO' ? '🚨' : '✅'}
                            </span>
                            <div style={styles.info}>
                                {alerta.tipoAlerta === 'TOMBO' ? 'Policía reportada' : 'Zona despejada'}
                            </div>
                            <div style={styles.time}>
                                {formatearFecha(alerta.timestamp)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={styles.empty}>
                    Sin alertas recientes
                </div>
            )}
        </div>
    );
};

export default AlertHistory;
