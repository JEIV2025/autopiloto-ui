
import './App.css';
import './App.css';
import React, { useState, useEffect } from 'react';

import MapView from './components/MapView';
import NavigationViewer from './components/NavigationViewer';
import ConsoleLog from './components/ConsoleLog';
import NavigationTablero from './components/NavigationTablero';
import ControlPanel from './components/ControlPanel';
import { useMapEvent } from 'react-leaflet';

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

const [currentPos, setCurrentPos] = useState({ lat: -34.585, lon: -58.375 });

const [waypoints, setWaypoints] = useState([
  { id: 'Base', lat: -34.58, lon: -58.38 },
  { id: 'P1', lat: -34.60, lon: -58.40 }
]);


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
            />
          )}
          {fullscreen === 'viewer' && <NavigationViewer posX={x} posY={y} />}
          {fullscreen === 'dashboard' && <NavigationTablero />}
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
          <div className="rounded-xl shadow overflow-hidden relative h-full">
            <button
              onClick={() => setFullscreen('map')}
              className="backButton"
            >
              🗖
            </button>
            <MapView currentPos={currentPos} waypoints={waypoints} fullscreen={fullscreen==='map'} onAddWaypoint={handleAddWaypoint} />
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
              <NavigationTablero
                currentPos={currentPos}
                setCurrentPos={setCurrentPos}
                waypoints={waypoints}
                setWaypoints={setWaypoints}
              />
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
