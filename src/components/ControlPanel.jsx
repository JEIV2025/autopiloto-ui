import React, { useState, useEffect  } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const ControlPanel = () => {
  const [calibrando, setCalibrando] = useState(false);
  const [calibrado, setCalibrado] = useState(false);


  const toggleCalibrar = () => {
    socket.emit('control-cmd', { cmd: 'calibrar' });
  };

  useEffect(() => {
  socket.on('telemetria', (data) => {
    try {
      const json = JSON.parse(data); 
      console.log('mensaje recibido del backend : ',json);
        if (typeof json.calibrando === 'boolean') {
          setCalibrando(json.calibrando);
        }

        if (typeof json.calibrado === 'boolean') {
          setCalibrado(json.calibrado);
        }
    } catch (e) {
      console.error('❌ Error parsing JSON:', e);
    }
  });

  return () => {
    socket.off('telemetria');
  };
}, []);



  return (
    <div className="w-full flex flex-row">
      {/* Mitad izquierda: botones de waypoint */}
      <div className="w-1/2 flex flex-col justify-center">
        <h2 className="font-semibold text-lg mb-2">Control de viaje</h2>
        <div className="flex flex-col gap-2">
          <button className="bg-violet-500 text-white px-3 py-2 font-semibold rounded shadow-md transition-all duration-300">
            Agregar Waypoint
          </button>
          <button className="bg-red-500 text-white px-3 py-2 font-semibold rounded shadow-md transition-all duration-300">
            Eliminar Waypoint
          </button>
          <button className="bg-yellow-500 text-white px-3 py-2 font-semibold rounded shadow-md transition-all duration-300">
            Modificar Waypoint
          </button>
        </div>
      </div>
      {/* Mitad derecha: botón de calibrado */}
      <div className="w-1/2 flex flex-col items-center justify-center">
        <button
          onClick={toggleCalibrar}
          className={`px-4 py-2 font-semibold rounded shadow-md transition-all duration-300 ${
            calibrando ? 'bg-yellow-500' : calibrado ? 'bg-green-600' : 'bg-blue-500'
          } text-white`}
        >
          {calibrando ? 'Calibrando...' : calibrado ? 'Calibrado ✅' : 'Calibrar IMU'}
        </button>
      </div>
    </div>
  );
}
export default ControlPanel;
