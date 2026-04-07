import React, { createContext, useContext, useEffect, useState } from 'react';
import socket from '../socket';

const TelemetryContext = createContext();

export const useTelemetry = () => useContext(TelemetryContext);

export const TelemetryProvider = ({ children }) => {
  const [telemetry, setTelemetry] = useState(null);
  const [calibrando, setCalibrando] = useState(false);
  const [calibrado, setCalibrado] = useState(false);

  useEffect(() => {
    

    socket.on('telemetria', (data) => {
      try {
        const json = JSON.parse(data);
        console.log('✅ Datos recibidos:', json);

        setTelemetry(json);

        if (typeof json.calibrando === 'boolean') setCalibrando(json.calibrando);
        if (typeof json.calibrado === 'boolean') setCalibrado(json.calibrado);

      } catch (e) {
        console.error('❌ Error al parsear JSON:', e);
      }
    });

    return () => {
      socket.off('telemetria');
    };
  }, []);

  return (
    <TelemetryContext.Provider value={{
      telemetry,
      calibrando,
      calibrado
    }}>
      {children}
    </TelemetryContext.Provider>
  );
};
