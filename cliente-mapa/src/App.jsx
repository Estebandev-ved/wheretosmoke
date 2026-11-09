import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MapComponent from './MapComponent';
import AdminPanel from './components/AdminPanel';
import OnboardingTutorial from './components/OnboardingTutorial';
import WeedDecorations from './components/WeedDecorations';
import AnimatedBackground from './components/AnimatedBackground';
import EasterEggs from './components/EasterEggs';
import PageTransition from './components/PageTransition';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import ExplorarPage from './components/ExplorarPage';
import AboutPage from './components/AboutPage';
import MisionesPage from './components/MisionesPage';
import TiendaPage from './components/TiendaPage';
import ProfilePage from './components/ProfilePage';
import SplashScreen from './components/SplashScreen';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/WeedToast';
import { ParticleProvider } from './components/ParticleEffects';
import { SoundProvider } from './context/SoundContext';
import { AchievementProvider } from './context/AchievementContext';
import { GamificacionProvider } from './context/GamificacionContext';
import 'react-toastify/dist/ReactToastify.css';
import AIChatComponent from './components/AIChatComponent';

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
  const [splashDone, setSplashDone] = useState(false);

  // 🌙 ESTADO GLOBAL DE MODO OSCURO
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default true (dark) if preferred
  });

  const handleToggleDarkMode = (newMode) => {
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  // 🤖 ESTADO DEL CHATBOT
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <BrowserRouter>
      <AuthProvider>
        <SoundProvider>
          <GamificacionProvider>
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
                  {splashDone && <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />}

                  <PageTransition>
                    <Routes>
                      {/* 🗺️ RUTA PRINCIPAL - MAPA */}
                      <Route path="/" element={<MapComponent darkMode={darkMode} setDarkMode={handleToggleDarkMode} />} />

                      {/* 🧭 EXPLORAR: Spots | Feed | Ranking (?tab=spots|feed|ranking) */}
                      <Route path="/explorar" element={<ExplorarPage darkMode={darkMode} />} />
                      <Route path="/feed" element={<Navigate to="/explorar?tab=feed" replace />} />
                      <Route path="/descubrir" element={<Navigate to="/explorar?tab=spots" replace />} />
                      <Route path="/leaderboard" element={<Navigate to="/explorar?tab=ranking" replace />} />

                      {/* ℹ️ QUIÉNES SOMOS */}
                      <Route path="/nosotros" element={<AboutPage darkMode={darkMode} />} />

                      {/* 🎯 MISIONES / 🛍️ TIENDA / 👤 PERFIL */}
                      <Route path="/misiones" element={<MisionesPage />} />
                      <Route path="/tienda" element={<TiendaPage />} />
                      <Route path="/perfil" element={<ProfilePage darkMode={darkMode} onChatClick={() => setIsChatOpen(true)} />} />

                      {/* 🔒 PANEL DE ADMINISTRACIÓN */}
                      <Route path="/admin" element={<AdminPanel />} />
                    </Routes>
                  </PageTransition>

                  {/* 🧭 NAVBAR INFERIOR - Visible en todas las páginas */}
                  <Navbar darkMode={darkMode} onChatClick={() => setIsChatOpen(!isChatOpen)} />

                  {/* ⏳ PANTALLA DE CARGA */}
                  {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

                  {/* 🤖 CHATBOT IA */}
                  <AIChatComponent isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
                </div>
              </ParticleProvider>
            </ToastProvider>
          </AchievementProvider>
          </GamificacionProvider>
        </SoundProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;