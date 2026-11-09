import React, { lazy, Suspense, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiMapPin, HiPhoto, HiTrophy } from 'react-icons/hi2';
import './gamificacion.css';
import './explorar.css';

const SpotsSection = lazy(() => import('./explorar/SpotsSection'));
const FeedSection = lazy(() => import('./explorar/FeedSection'));
const RankingSection = lazy(() => import('./explorar/RankingSection'));

const SECCIONES = [
    { key: 'spots', label: 'Spots', icon: HiMapPin, Comp: SpotsSection },
    { key: 'feed', label: 'Feed', icon: HiPhoto, Comp: FeedSection },
    { key: 'ranking', label: 'Ranking', icon: HiTrophy, Comp: RankingSection },
];
const SUBTITULOS = {
    spots: 'Descubre los mejores spots de Medellín.',
    feed: 'Lo último que sube la comunidad.',
    ranking: 'Quiénes más aportan a la comunidad.',
};

const CargandoSeccion = () => (
    <div className="ex-loading" aria-busy="true" aria-label="Cargando sección">
        <div className="gm-skel ex-skel-row" />
        <div className="gm-skel ex-skel-row" />
        <div className="gm-skel ex-skel-row" />
    </div>
);

/**
 * Explorar: reúne Spots, Feed y Ranking con un control segmentado.
 * La sección activa vive en la URL (?tab=spots|feed|ranking).
 */
const ExplorarPage = ({ darkMode = true }) => {
    const [params, setParams] = useSearchParams();
    const pedida = params.get('tab');
    const activa = SECCIONES.some((s) => s.key === pedida) ? pedida : 'spots';
    // Las secciones ya visitadas quedan montadas (conservan datos y scroll)
    const [visitadas, setVisitadas] = useState(() => new Set([activa]));
    const visitadasAhora = visitadas.has(activa) ? visitadas : new Set([...visitadas, activa]);
    if (visitadasAhora !== visitadas) setVisitadas(visitadasAhora);
    const refs = useRef({});

    const ir = (key) => setParams({ tab: key }, { replace: true });

    const onKeyDown = (e) => {
        const i = SECCIONES.findIndex((s) => s.key === activa);
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % SECCIONES.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + SECCIONES.length) % SECCIONES.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = SECCIONES.length - 1;
        if (n === null) return;
        e.preventDefault();
        ir(SECCIONES[n].key);
        refs.current[SECCIONES[n].key]?.focus();
    };

    return (
        <main className={`gm-page ex-page ${darkMode ? '' : 'ex-light'}`}>
            <header className="ex-header">
                <div className="ex-header-inner">
                    <div className="ex-title">
                        <h1>Explorar</h1>
                        <p className="gm-sub">{SUBTITULOS[activa]}</p>
                    </div>
                    <div className="ex-tabs" role="tablist" aria-label="Secciones de Explorar" onKeyDown={onKeyDown}>
                        {SECCIONES.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                ref={(el) => { refs.current[key] = el; }}
                                type="button"
                                role="tab"
                                id={`ex-tab-${key}`}
                                aria-selected={activa === key}
                                aria-controls={`ex-panel-${key}`}
                                tabIndex={activa === key ? 0 : -1}
                                className={`ex-tab ${activa === key ? 'is-active' : ''}`}
                                onClick={() => ir(key)}
                            >
                                {React.createElement(Icon, { size: 16, 'aria-hidden': 'true' })}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="gm-wrap ex-body">
                {SECCIONES.map(({ key, Comp }) => (
                    visitadasAhora.has(key) && (
                        <section
                            key={key}
                            role="tabpanel"
                            id={`ex-panel-${key}`}
                            aria-labelledby={`ex-tab-${key}`}
                            hidden={activa !== key}
                            className="ex-panel"
                        >
                            <Suspense fallback={<CargandoSeccion />}>
                                {React.createElement(Comp, { darkMode })}
                            </Suspense>
                        </section>
                    )
                ))}
            </div>
        </main>
    );
};

export default ExplorarPage;
