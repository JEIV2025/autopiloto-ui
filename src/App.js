
import './App.css';
import './App.css';
import React, { useState, useEffect } from 'react';

import MapView from './components/MapView';
import NavigationViewer from './components/NavigationViewer';
import ConsoleLog from './components/ConsoleLog';
import NavigationDashboard from './components/NavigationTablero';
import ControlPanel from './components/ControlPanel';

function App() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [fullscreen, setFullscreen] = useState(null); // <- nuevo

  useEffect(() => {
    const interval = setInterval(() => {
      setX(prev => prev + 10);
      setY(prev => prev + 5);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const renderFullscreen = (key, content) => {
    return (
      <div className="fixed inset-0 bg-white z-50 p-4 overflow-auto">
        <button
          onClick={() => setFullscreen(null)}
          className="absolute top-2 right-2 bg-gray-200 border border-gray-400 px-2 py-1 rounded"
        >
         ⤶ Volver
        </button>
        {content}
      </div>
    );
  };

  return (
  <div className="min-h-screen bg-gray-100 p-2 space-y-2">
    {/* FULLSCREEN (cuando aplica) */}
    {fullscreen && (
      <div className="fixed inset-0 bg-white z-50 p-4 overflow-auto">
        <button
          onClick={() => setFullscreen(null)}
          className="backButton"
        >
          ⤶ Volver
        </button>

        <div className="mt-10">
          {fullscreen === 'map' && <MapView />}
          {fullscreen === 'viewer' && <NavigationViewer posX={x} posY={y} />}
          {fullscreen === 'dashboard' && <NavigationDashboard />}
          {fullscreen === 'panel' && <ControlPanel />}
          {fullscreen === 'console' && <ConsoleLog />}
        </div>
      </div>
    )}

    {/* LAYOUT NORMAL */}
    {!fullscreen && (
      <>
        {/* FILA SUPERIOR */}
        <div className="grid grid-cols-2 gap-2 h-[45vh]">
          <div className="rounded-xl shadow overflow-hidden relative">
            <button
              onClick={() => setFullscreen('map')}
              className="backButton"
            >
              🗖
            </button>
            <MapView />
          </div>

          <div className="bg-black rounded-xl shadow flex items-center justify-center relative">
            <button
              onClick={() => setFullscreen('viewer')}
              className="backButton"
            >
              🗖
            </button>
            <NavigationViewer posX={x} posY={y} />
          </div>
        </div>

        {/* FILA INFERIOR */}
        <div className="grid grid-cols-12 gap-2 h-[45vh]">
          <div className="col-span-6 relative w-full h-full">
            <div className="absolute inset-0 z-0 logoBack" />
            <div className="relative z-10 p-2 bg-white/80 rounded-xl shadow h-full">
              <button
                onClick={() => setFullscreen('dashboard')}
                className="backButton"
              >
                🗖
              </button>
              <h2 className="font-semibold text-lg mb-2 text-black">📈 Instrumental de Navegación</h2>
              <NavigationDashboard />
            </div>
          </div>

          <div className="col-span-3 bg-white rounded-xl shadow p-2 relative">
            <button
              onClick={() => setFullscreen('panel')}
              className="backButton"
            >
              🗖
            </button>
            <h2 className="font-semibold text-lg mb-2">🎛️ Panel de Control</h2>
            <ControlPanel />
          </div>

          <div className="col-span-3 bg-white rounded-xl shadow p-2 flex flex-col h-full relative">
            <button
              onClick={() => setFullscreen('console')}
              className="backButton"
            >
              🗖
            </button>
            <h2 className="font-semibold text-lg mb-2">🧾 Consola de Mensajes</h2>
            <ConsoleLog />
          </div>
        </div>
      </>
    )}
  </div>
);

}

export default App;
