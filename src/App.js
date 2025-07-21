
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


    // Simulación: mover cada 0.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setX(prev => prev + 10);
      setY(prev => prev + 5);
    }, 500);
    return () => clearInterval(interval);
  }, []);


  return (
 <div className="min-h-screen bg-gray-100 p-2 space-y-2">
      {/* FILA SUPERIOR */}
      <div className="grid grid-cols-2 gap-2 h-[45vh]">
        {/* Mapa GPS */}
        <div className="rounded-xl shadow overflow-hidden">
          <MapView />
        </div>

        {/* Visor navegación */}
        <div className="bg-black rounded-xl shadow flex items-center justify-center">
          <NavigationViewer posX={x} posY={y} />
        </div>
      </div>

      {/* FILA INFERIOR */}
      <div className="grid grid-cols-12 gap-2 h-[45vh]">
        {/* Gráficos */}


      <div className="col-span-6 navigation-tablero relative w-full h-full">
      <div className="logoBack absolute inset-0 z-0" />

      <div className="relative z-10">
        <h2 className="font-semibold text-lg mb-2 text-black">📈 Instrumental de Navegación</h2>
        <NavigationDashboard />
      </div>
    </div>

        {/* Panel de control */}
        <div className="col-span-3 bg-white rounded-xl shadow p-2">
          <h2 className="font-semibold text-lg mb-2">🎛️ Panel de Control</h2>
          <ControlPanel />
        </div>

          {/* Consola de logs */}
          <div className="col-span-3 bg-white rounded-xl shadow p-2 flex flex-col h-full">
            <h2 className="font-semibold text-lg mb-2">🧾 Consola de Mensajes</h2>
            <ConsoleLog />
          </div>
      </div>
    </div>
  );
}

export default App;
