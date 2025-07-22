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
    <div className="h-1/2 bg-gray-100 flex flex-col items-center justify-center">
      <button
        onClick={toggleCalibrar}
        className={`px-4 py-2 font-semibold rounded shadow-md transition-all duration-300 ${
          calibrando ? 'bg-yellow-500' : calibrado ? 'bg-green-600' : 'bg-blue-500'
        } text-white`}
      >
        {calibrando ? 'Calibrando...' : calibrado ? 'Calibrado ✅' : 'Calibrar IMU'}
      </button>
    </div>
  );
};

export default ControlPanel;
