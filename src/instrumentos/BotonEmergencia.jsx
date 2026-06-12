import React, { useState } from 'react';
import '../style/BotonEmergencia.css';

const BotonEmergencia = ({ socket }) => {
  const [confirmEmergency, setConfirmEmergency] = useState(false);

  const handleEmergencyStop = () => {
    socket.emit('control-cmd', {
      cmd: 'emergencyStop'
    });

    console.log('🚨 EMERGENCY STOP enviado');
    setConfirmEmergency(false);
  };

  return (
    <div className="emergencyStopCell">

      <div
        className={`emergencyStopBox ${
          confirmEmergency ? 'confirm' : ''
        }`}
      >

        {!confirmEmergency ? (
          <button
            className="emergencyStopBtn"
            onClick={() => setConfirmEmergency(true)}
          >
            <span className="emergencyStopIcon">⛔</span>

            <span className="emergencyStopText">
              PARADA
            </span>

            <span className="emergencyStopSub">
              EMERGENCIA
            </span>
          </button>
        ) : (
          <div className="emergencyConfirmPanel">

            <div className="emergencyConfirmTitle">
              ⚠️ Confirmar parada
            </div>

            <div className="emergencyConfirmText">
              El vehículo detendrá inmediatamente
              todos los actuadores.
            </div>

            <div className="emergencyConfirmActions">

              <button
                className="emergencyCancelBtn"
                onClick={() => setConfirmEmergency(false)}
              >
                Cancelar
              </button>

              <button
                className="emergencyConfirmBtn"
                onClick={handleEmergencyStop}
              >
                Confirmar
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default BotonEmergencia;