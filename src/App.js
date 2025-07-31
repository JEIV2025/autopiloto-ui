
import './App.css';
import React, { useState, useEffect } from 'react';

import MapView from './components/MapView';
import NavigationViewer from './components/NavigationViewer';
import ConsoleLog from './components/ConsoleLog';
import NavigationTablero from './components/NavigationTablero';
import ControlPanel from './components/ControlPanel';
import PlanManager from './components/PlanManager';
import UnifiedAIPanel from './components/UnifiedAIPanel';

import { useUnifiedAI } from './hooks/useUnifiedAI';

function App() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [fullscreen, setFullscreen] = useState(null); // <- nuevo
  const [progressIdx, setProgressIdx] = useState(0); // Nuevo estado para el progreso secuencial
  const [showPlanManager, setShowPlanManager] = useState(false); // Estado para el modal de planes
  
  const [currentPos, setCurrentPos] = useState({ lat: -34.585, lon: -58.375 });

  const [waypoints, setWaypoints] = useState([
    { id: 'Base', lat: -34.58, lon: -58.38 }
  ]);

  // Hook para predicciones de IA unificada
  const { 
    predictions, 
    isAILoading, 
    isTraining,
    trainingProgress,
    aiError, 
    updatePredictions 
  } = useUnifiedAI();

  useEffect(() => {
    const interval = setInterval(() => {
      setX(prev => prev + 10);
      setY(prev => prev + 5);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Actualizar predicciones de IA cada 30 segundos
  useEffect(() => {
    const aiInterval = setInterval(() => {
      updatePredictions(currentPos, waypoints, progressIdx);
    }, 30000);

    return () => clearInterval(aiInterval);
  }, [currentPos, waypoints, progressIdx, updatePredictions]);


useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setCurrentPos({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
    },
    (err) => {
      console.error("Error de geolocalización:", err);
    }
  );
}, []);

const handleAddWaypoint = (latlng) => {
  setWaypoints((prev) => [
    ...prev,
    {
      id: `WP${prev.length + 1}`,
      lat: latlng.lat,
      lon: latlng.lng,
    },
  ]);
};


  return (
  <div className="h-full bg-gray-100 p-2 space-y-2">
    {/* Botones de control superior */}
    <div className="mb-2 flex gap-2">
      <button
        onClick={() => setProgressIdx(idx => Math.min(idx + 1, waypoints.length - 2))}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
      >
        Siguiente WP
      </button>
      <button
        onClick={() => setShowPlanManager(true)}
        className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
      >
        Gestor de Planes
      </button>
      <button
        onClick={() => updatePredictions(currentPos, waypoints, progressIdx)}
        className="px-4 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700"
      >
        🤖 Actualizar IA
      </button>

    </div>
    {/* FULLSCREEN (cuando aplica) */}
    {fullscreen && (
      <div className="fixed inset-0 bg-white z-50 p-4 flex flex-col h-full">
        <button
          onClick={() => setFullscreen(null)}
          className="backButton"
        >
          ⤶ Volver
        </button>
        <div className="flex-1 w-full h-full">
          {fullscreen === 'map' && (
            <MapView
              currentPos={currentPos}
              waypoints={waypoints}
              fullscreen={fullscreen === 'map'}
              onAddWaypoint={handleAddWaypoint}
              progressIdx={progressIdx}
            />
          )}
          {fullscreen === 'viewer' && <NavigationViewer posX={x} posY={y} />}
          {fullscreen === 'dashboard' && <NavigationTablero    
            currentPos={currentPos}
            setCurrentPos={setCurrentPos}
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            progressIdx={progressIdx}
          />}
          {fullscreen === 'panel' && <ControlPanel waypoints={waypoints} setWaypoints={setWaypoints} currentPos={currentPos} progressIdx={progressIdx} setProgressIdx={setProgressIdx} />}
          {fullscreen === 'console' && <ConsoleLog />}

        </div>
      </div>
    )}

    {/* LAYOUT NORMAL */}
    {!fullscreen && (
      <>
        {/* FILA SUPERIOR */}
        <div className="grid grid-cols-2 gap-2 h-[45vh]">
          <div className="rounded-xl shadow overflow-hidden relative h-full">
            <button
              onClick={() => setFullscreen('map')}
              className="backButton"
            >
              🗖
            </button>
            <MapView currentPos={currentPos} waypoints={waypoints} fullscreen={fullscreen==='map'} onAddWaypoint={handleAddWaypoint} progressIdx={progressIdx} />
          </div>
          <div className="bg-black rounded-xl shadow flex items-center justify-center relative h-full">
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
        <div className="lowSection">
          <div className="col-span-6" style={{ position: 'relative' }}>
            <div className="instrumentos-container" style={{ height: '100%' }}>
              <button
                onClick={() => setFullscreen('dashboard')}
                className="backButton"
                style={{ zIndex: 10 }}
              >
                🗖
              </button>
              <h2 className="font-semibold text-lg mb-2 text-black">📈 Instrumental de Navegación</h2>
              <NavigationTablero
                currentPos={currentPos}
                setCurrentPos={setCurrentPos}
                waypoints={waypoints}
                setWaypoints={setWaypoints}
                progressIdx={progressIdx}
              />
            </div>
          </div>

          <div className="consolas">
            <div className="controlPanel relative" style={{ paddingBottom: '20px' }}>
              <button
                onClick={() => setFullscreen('panel')}
                className="backButton"
              >
                🗖
              </button>
              <h2 className="font-semibold text-lg mb-2">🎛️ Panel de Control</h2>
              
                <ControlPanel waypoints={waypoints} setWaypoints={setWaypoints} currentPos={currentPos} progressIdx={progressIdx} setProgressIdx={setProgressIdx} />
            </div>
            <div className="consoleLog relative">
              <button
                onClick={() => setFullscreen('console')}
                className="backButton"
              >
                🗖
              </button>
              <h2 className="font-semibold text-lg mb-2">🧾 Consola de Mensajes</h2>
              
                <ConsoleLog />
            </div>
            <div className="aiPredictions relative">
              <UnifiedAIPanel 
                predictions={predictions}
                isAILoading={isAILoading}
                isTraining={isTraining}
                trainingProgress={trainingProgress}
                aiError={aiError}
              />
            </div>
          </div>
        </div>
      </>
    )}

    {/* Modal del PlanManager */}
    {showPlanManager && (
      <PlanManager
        waypoints={waypoints}
        setWaypoints={setWaypoints}
        progressIdx={progressIdx}
        setProgressIdx={setProgressIdx}
        onClose={() => setShowPlanManager(false)}
      />
    )}
  </div>
);

}

export default App;
