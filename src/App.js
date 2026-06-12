import './App.css';
import React, { useState, useEffect } from 'react';

import MapView from './components/MapView';
import NavigationViewer from './components/NavigationViewer';
import NavigationTablero from './components/NavigationTablero';
import ControlPanel from './components/ControlPanel';
import WayPointsTable from './components/WayPointsTable';
import PlanManager from './components/PlanManager';
import SideBar from './components/SideBar'; 
import ConsoleState from './components/ConsoleState';
import { useTelemetry } from './components/TelemetryContext';


function App() {

  const { telemetry } = useTelemetry();
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [progressIdx, setProgressIdx] = useState(0); 
  const [showPlanManager, setShowPlanManager] = useState(false); 
  const [mostrarAside, setMostrarAside] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState("inicio");
  const [seccionAnterior, setSeccionAnterior] = useState("inicio");

  const [misionCargadaEnVehiculo, setMisionCargadaEnVehiculo] = useState(false);
  

  const [simulatedPath, setSimulatedPath] = useState([]);

  const [distanciasSeguridad, setDistanciasSeguridad] = useState({
  distmin: 40,
  distmax: 200,
  sonido: true
});


const [mode, setMode] = useState("superficie");

//...para saber si estoy simulando o utilizo coordenadas reales
const [simulacionActiva, setSimulacionActiva] = useState(false);
  
const [currentPos, setCurrentPos] = useState({
  lat: -34.5884060,
  lon: -58.3665789,
  rumbo: 0
});

const [waypoints, setWaypoints] = useState([
  {
    id: 'Inicio',
    lat: -34.5884060,
    lon: -58.3665789,
    altura: 0,
    velocidad: 0,
    radioLlegada: 0,
  }
]);

  const [simBoatHeading, setSimBoatHeading] = useState(null);
//-- posicionamiento por telemetria...........
  const telemetriaValida =
  typeof telemetry?.lat === 'number' &&
  typeof telemetry?.lon === 'number';

const posicionReal = telemetriaValida
  ? {
      lat: telemetry.lat,
      lon: telemetry.lon,
      rumbo: telemetry.rumbo ?? 0,
    }
  : null;

  const posicionMapa = simulacionActiva
  ? currentPos
  : posicionReal ?? currentPos;

  //.....

  useEffect(() => {
    const interval = setInterval(() => {
      setX(prev => prev + 10);
      setY(prev => prev + 5);
    }, 500);
    return () => clearInterval(interval);
  }, []);


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
/*
useEffect(() => {
  setWaypoints(prev => {
    if (!prev.length) return prev;

    return prev.map((wp, idx) =>
      idx === 0
        ? {
            ...wp,
            id: 'Inicio',
            lat: currentPos.lat,
            lon: currentPos.lon,
            altura: 0,
            velocidad: 0,
            radioLlegada: 0,
          }
        : wp
    );
  });
}, [currentPos.lat, currentPos.lon]);
*/
const handleAddWaypoint = (latlng) => {
  setWaypoints((prev) => {
    const cantidadWP = prev.filter(
      wp => wp.id !== "Inicio"
    ).length;

    return [
      ...prev,
      {
        id: `WP${cantidadWP + 1}`,
        lat: latlng.lat,
        lon: latlng.lng,
        altura: 0,
        velocidad: 0,
        radioLlegada: 2,
      },
    ];
  });
};


  return (
    <div className="flex h-screen">
      {/* Aside lateral */}
      {mostrarAside && (
        <SideBar
          mostrarAside={mostrarAside}
          seccionActiva={seccionActiva}
          setSeccionActiva={setSeccionActiva}
          setSeccionAnterior={setSeccionAnterior}
          setShowPlanManager={setShowPlanManager} 
        />
      )}

      {/* Contenido principal */}
      <main className="flex-1 bg-gray-100 p-4 relative">
        
        {/* Botón para ocultar / mostrar el menú */}
        <button
          onClick={() => setMostrarAside(prev => !prev)}
          className="bntMenu absolute top-2 left-2 bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700 z-10"
        >
          {mostrarAside ? '⟨' : '☰'}
        </button>

        {/* Acá va el contenido principal actual */}

          {seccionActiva === "navegacion" && (
            <div className="contenedorNavegacion grid grid-rows-[48%_75%] gap-4 h-full min-h-0">
              <div className="bg-white rounded-xl shadow p-2 overflow-hidden min-h-0">
                <NavigationViewer />
              </div>

              <div className="bg-[#64778aff] rounded-xl shadow p-2 overflow-auto min-h-0">
                <NavigationTablero
                  currentPos={currentPos}
                  setCurrentPos={setCurrentPos}
                  waypoints={waypoints}
                  setWaypoints={setWaypoints}
                  progressIdx={progressIdx}
                  mode={mode}
                  setMode={setMode}
                  distanciasSeguridad={distanciasSeguridad}
                />
              </div>
            </div>
          )}

        {seccionActiva === "mision" && (
          <div className="grid grid-rows-5 gap-4 h-full">
            <div className="row-span-3 rounded-xl shadow overflow-hidden relative h-full">
              <MapView
                waypoints={waypoints}
                onAddWaypoint={handleAddWaypoint}
                progressIdx={progressIdx}
                currentPos={posicionMapa}
                simBoatHeading={simBoatHeading} 
                simulatedPath={simulatedPath}
                mode={mode}
              />
            </div>
            <div className="row-span-2 bg-white rounded-xl shadow  ">
              <WayPointsTable
                currentPos={posicionMapa}
                setCurrentPos={setCurrentPos}
                waypoints={waypoints}
                setWaypoints={setWaypoints}
                progressIdx={progressIdx}
                setProgressIdx={setProgressIdx}
                setSimBoatHeading={setSimBoatHeading} 
                simulatedPath={simulatedPath}
                setSimulatedPath={setSimulatedPath}
                misionCargadaEnVehiculo={misionCargadaEnVehiculo}
                setSimulacionActiva={setSimulacionActiva}
              />
            </div>
          </div>
        )}

        {seccionActiva === "panel" && (
          <div className="grid grid-rows-2 gap-4 h-full w-full" >
            <div className="controlPanel relative" style={{ paddingBottom: '20px' }}>          
              <h2 className="font-semibold text-lg mb-2">🎛️ Panel de Control</h2> 
              <div className="stateBar w-full flex justify-center mb-2"style={{ width: '100%', height: '35%' }}>
                <ConsoleState />
              </div>             
                <ControlPanel waypoints={waypoints} 
                setWaypoints={setWaypoints} 
                currentPos={currentPos} 
                progressIdx={progressIdx} 
                setProgressIdx={setProgressIdx} 
                setMisionCargadaEnVehiculo={setMisionCargadaEnVehiculo}
                distanciasSeguridad={distanciasSeguridad}
                setDistanciasSeguridad={setDistanciasSeguridad}
               />
            </div>
          </div>     
        )}

        {/* {seccionActiva === "consola" && (
            <div className="consoleLog relative">
              <h2 className="font-semibold text-lg mb-2">🧾 Consola de Mensajes</h2>                    
              <ConsoleLog />
            </div> 
        )} */}

        {seccionActiva === "guardar" && (
        <>
                  {showPlanManager && (
                    <PlanManager
                      waypoints={waypoints}
                      setWaypoints={setWaypoints}
                      progressIdx={progressIdx}
                      setProgressIdx={setProgressIdx}
                      onClose={() => {
                          setShowPlanManager(false);
                          setSeccionActiva(seccionAnterior);
                        }}
                    />
                  )}

        </> 
        )}


        {seccionActiva === "inicio" && (
              <div className="flex flex-col items-center justify-start w-full h-full px-6 py-4 space-y-6">

                      {/* Encabezado: Logos y título */}
                      <div className="encabezado flex items-center justify-between w-full max-w-6xl mb-4">
                        <img src="/images/LogoDIIV.png" alt="Logo1" className="h-20" />
                        
                        <h1 className="text-4xl font-extrabold text-center text-gray-800 flex-1">
                          Sistema de Navegación Autónoma para Embarcaciones No Tripuladas
                        </h1>

                        <img src="/images/Armada.png" alt="Logo2" className="h-20" />
                      </div>

                      {/* Descripción */}
                      <p className="subEncabezado text-lg text-gray-700 max-w-4xl text-center -mt-2">
                        Proyecto orientado al desarrollo de un sistema completo de control, navegación y telemetría 
                        para embarcaciones no tripuladas. Basado en sensores inerciales, GPS y comunicación remota.
                      </p>

                      {/* Video de demostración */}
                      <div className="videoInicio w-full max-w-7xl flex-1 rounded-xl overflow-hidden shadow-xl border border-gray-300">
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          style={{ minHeight: '60vh', maxHeight: '80vh' }}
                        >
                          <source src="/videos/videoInicio.mp4" type="video/mp4" />
                          Tu navegador no soporta el video.
                        </video>
                      </div>

              </div>


        )}

      </main>
    </div>


      
);

}

export default App;