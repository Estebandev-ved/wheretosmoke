import React, { useEffect, useRef, useId } from 'react';
import { HiXMark } from 'react-icons/hi2';
import './bottom-sheet.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hoja inferior reutilizable (Círculos, Rutas).
 * - modal (por defecto): fondo atenuado, role="dialog" + aria-modal, foco atrapado,
 *   cierra con Escape o tocando fuera.
 * - compact: tarjeta acoplada abajo SIN fondo, para dejar el mapa tocable (p. ej. elegir
 *   origen/destino o ver la ruta). No atrapa el foco, pero sí cierra con Escape.
 */
export default function BottomSheet({
    title, subtitle, icon: Icon, onClose, onEscape, children,
    modal = true, compact = false, className = '',
}) {
    const panelRef = useRef(null);
    const titleId = useId();
    const escRef = useRef(onEscape || onClose);
    useEffect(() => { escRef.current = onEscape || onClose; });

    // Foco inicial en la hoja y restauración al cerrar
    useEffect(() => {
        const previo = document.activeElement;
        panelRef.current?.focus({ preventScroll: true });
        return () => {
            if (previo && typeof previo.focus === 'function' && document.contains(previo)) {
                previo.focus({ preventScroll: true });
            }
        };
    }, []);

    // Escape cierra
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') escRef.current && escRef.current();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Trampa de foco razonable (solo modal)
    const onKeyDown = (e) => {
        if (!modal || e.key !== 'Tab' || !panelRef.current) return;
        const items = Array.from(panelRef.current.querySelectorAll(FOCUSABLE))
            .filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (items.length === 0) {
            e.preventDefault();
            panelRef.current.focus();
            return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    return (
        <div
            className={`bs-layer${compact ? ' is-compact' : ''}${modal ? ' is-modal' : ''}`}
            onMouseDown={(e) => { if (modal && e.target === e.currentTarget) onClose(); }}
        >
            <section
                ref={panelRef}
                className={`bs-panel ${className}`}
                role="dialog"
                aria-modal={modal ? 'true' : 'false'}
                aria-labelledby={titleId}
                tabIndex={-1}
                onKeyDown={onKeyDown}
            >
                <div className="bs-grab" aria-hidden="true" />
                <header className="bs-head">
                    {Icon && (
                        <span className="bs-head__icon" aria-hidden="true"><Icon size={22} /></span>
                    )}
                    <div className="bs-head__text">
                        <h2 id={titleId}>{title}</h2>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <button type="button" className="bs-close" onClick={onClose} aria-label="Cerrar">
                        <HiXMark size={22} aria-hidden="true" />
                    </button>
                </header>
                {children}
            </section>
        </div>
    );
}
