import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MapComponent from './MapComponent';
import AdminPanel from './components/AdminPanel';
import OnboardingTutorial from './components/OnboardingTutorial';
import WeedDecorations from './components/WeedDecorations';
import AnimatedBackground from './components/AnimatedBackground';
import EasterEggs from './components/EasterEggs';
import PageTransition from './components/PageTransition';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import FeedPage from './components/FeedPage';
import DescubrirPage from './components/DescubrirPage';
import AboutPage from './components/AboutPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/WeedToast';
import { ParticleProvider } from './components/ParticleEffects';
import { SoundProvider } from './context/SoundContext';
import { AchievementProvider } from './context/AchievementContext';
import 'react-toastify/dist/ReactToastify.css';

/**
 * 📱 APP PRINCIPAL - WhereToSmoke
 * 
 * Envuelve toda la app en los providers necesarios:
 * - BrowserRouter: Routing entre mapa y admin panel
 * - AuthProvider: Maneja el estado de autenticación
 * - ToastContainer: Muestra notificaciones
 */
function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  // 🌙 ESTADO GLOBAL DE MODO OSCURO
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default true (dark) if preferred
  });

  const handleToggleDarkMode = (newMode) => {
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <SoundProvider>
          <AchievementProvider>
            <ToastProvider>
              <ParticleProvider>
                <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
                  {/* 🌌 FONDO ANIMADO */}
                  <AnimatedBackground darkMode={darkMode} />

                  {/* 🌿 DECORACIONES TEMÁTICAS */}
                  <WeedDecorations />

                  {/* 🥚 EASTER EGGS */}
                  <EasterEggs />

                  {/* 🖱️ CUSTOM CURSOR - DESACTIVADO POR RENDIMIENTO */}
                  {/* <CustomCursor /> */}

                  {/* 🎓 TUTORIAL DE BIENVENIDA */}
                  <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />

                  <PageTransition>
                    <Routes>
                      {/* 🗺️ RUTA PRINCIPAL - MAPA */}
                      <Route path="/" element={<MapComponent darkMode={darkMode} setDarkMode={handleToggleDarkMode} />} />

                      {/* 📸 FEED DE FOTOS */}
                      <Route path="/feed" element={<FeedPage darkMode={darkMode} />} />

                      {/* 🔥 DESCUBRIR SPOTS */}
                      <Route path="/descubrir" element={<DescubrirPage darkMode={darkMode} />} />

                      {/* ℹ️ QUIÉNES SOMOS */}
                      <Route path="/nosotros" element={<AboutPage darkMode={darkMode} />} />

                      {/* 🔒 PANEL DE ADMINISTRACIÓN */}
                      <Route path="/admin" element={<AdminPanel />} />
                    </Routes>
                  </PageTransition>

                  {/* 🧭 NAVBAR INFERIOR - Visible en todas las páginas */}
                  <Navbar darkMode={darkMode} />
                </div>
              </ParticleProvider>
            </ToastProvider>
          </AchievementProvider>
        </SoundProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;