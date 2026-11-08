import React from 'react';
import { HiMapPin, HiShieldExclamation, HiSparkles } from 'react-icons/hi2';

/**
 * Filtros del mapa como fila de chips (Todos / Tombo / Relax).
 * Los contadores son reales: se calculan en MapComponent a partir de los spots cargados.
 */
const Controls = ({ filter, setFilter, counts }) => {
    const items = [
        { key: 'ALL', label: 'Todos', icon: HiMapPin, count: counts?.total, tone: 'accent' },
        { key: 'ROJO', label: 'Tombo', icon: HiShieldExclamation, count: counts?.tombo, tone: 'danger' },
        { key: 'VERDE', label: 'Relax', icon: HiSparkles, count: counts?.relax, tone: 'accent' },
    ];

    return (
        <div className="hud-filters" role="group" aria-label="Filtrar spots">
            {items.map(({ key, label, icon, count, tone }) => {
                const Icon = icon;
                return (
                <button
                    key={key}
                    type="button"
                    className={`hud-chip hud-chip--filter hud-chip--${tone}${filter === key ? ' is-active' : ''}`}
                    onClick={() => setFilter(key)}
                    aria-pressed={filter === key}
                    aria-label={`Filtrar: ${label}`}
                >
                    <Icon size={15} aria-hidden="true" />
                    <span>{label}</span>
                    {typeof count === 'number' && <span className="hud-chip__count">{count}</span>}
                </button>
                );
            })}
        </div>
    );
};

export default Controls;
