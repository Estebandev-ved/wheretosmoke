import React, { useState, useEffect } from 'react';

/**
 * 🚨 BOTÓN DE PÁNICO (MODO DISCRETO)
 * 
 * Al presionarlo, cambia la app a una vista inocua (calculadora, notas, etc.)
 */
const PanicButton = ({ darkMode = false }) => {
    const [panicMode, setPanicMode] = useState(false);
    const [fakeValue, setFakeValue] = useState('0');

    // Detectar tecla Escape para salir
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && panicMode) {
                exitPanicMode();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [panicMode]);

    const enterPanicMode = () => {
        setPanicMode(true);
        document.body.style.overflow = 'hidden';
    };

    const exitPanicMode = () => {
        setPanicMode(false);
        setFakeValue('0');
        document.body.style.overflow = '';
    };

    // Simular calculadora básica
    const handleCalcClick = (val) => {
        if (val === 'C') {
            setFakeValue('0');
        } else if (val === '=') {
            try {
                // Muy simple, solo para simular
                setFakeValue(String(eval(fakeValue) || 0));
            } catch {
                setFakeValue('Error');
            }
        } else {
            setFakeValue(fakeValue === '0' ? val : fakeValue + val);
        }
    };

    const styles = {
        button: {
            position: 'fixed',
            bottom: '90px',
            left: '15px',
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            backgroundColor: darkMode ? '#333' : '#f5f5f5',
            border: `2px solid ${darkMode ? '#444' : '#ddd'}`,
            color: darkMode ? '#888' : '#999',
            fontSize: '18px',
            cursor: 'pointer',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            transition: 'all 0.2s'
        },
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#1c1c1c',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        },
        calcContainer: {
            width: '300px',
            backgroundColor: '#2c2c2c',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        },
        display: {
            width: '100%',
            padding: '20px',
            fontSize: '36px',
            textAlign: 'right',
            backgroundColor: '#1c1c1c',
            color: 'white',
            borderRadius: '10px',
            marginBottom: '15px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxSizing: 'border-box'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px'
        },
        calcBtn: (isOp) => ({
            padding: '20px',
            fontSize: '20px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: isOp ? '#ff9500' : '#3c3c3c',
            color: 'white',
            cursor: 'pointer'
        }),
        exitHint: {
            marginTop: '30px',
            color: '#666',
            fontSize: '12px',
            textAlign: 'center'
        }
    };

    const calcButtons = [
        'C', '±', '%', '÷',
        '7', '8', '9', '×',
        '4', '5', '6', '-',
        '1', '2', '3', '+',
        '0', '.', '=', ''
    ];

    if (panicMode) {
        return (
            <div style={styles.overlay} onClick={(e) => {
                // Triple click para salir
                if (e.detail === 3) exitPanicMode();
            }}>
                <div style={styles.calcContainer}>
                    <div style={styles.display}>{fakeValue}</div>
                    <div style={styles.grid}>
                        {calcButtons.map((btn, i) => (
                            btn && (
                                <button
                                    key={i}
                                    style={styles.calcBtn(['÷', '×', '-', '+', '='].includes(btn))}
                                    onClick={() => {
                                        const map = { '÷': '/', '×': '*' };
                                        handleCalcClick(map[btn] || btn);
                                    }}
                                >
                                    {btn}
                                </button>
                            )
                        ))}
                    </div>
                </div>
                <div style={styles.exitHint}>
                    Triple click o ESC para volver
                </div>
            </div>
        );
    }

    return (
        <button
            style={styles.button}
            onClick={enterPanicMode}
            title="Modo discreto"
            aria-label="Activar modo discreto"
        >
            🔢
        </button>
    );
};

export default PanicButton;
