import React, { useState, useEffect, useRef  } from 'react';
import io from 'socket.io-client';


const socket = io('http://localhost:3001');

const ControlPanel = ({ waypoints, setWaypoints, currentPos, progressIdx, setProgressIdx }) => {
  const [calibrando, setCalibrando] = useState(false);
  const [calibrado, setCalibrado] = useState(false);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [showWaypointForm, setShowWaypointForm] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState({ lat: '', lon: '' });
  const [showConfirm, setShowConfirm] = useState(false);

  const [estadoEnvio, setEstadoEnvio] = useState(null);     // Envío de misión
  const [estadoCarga, setEstadoCarga] = useState(null);     // Carga desde el micro
  const [showConfirmEnviar, setShowConfirmEnviar] = useState(false);
const [showConfirmCargar, setShowConfirmCargar] = useState(false);
const respuestaRecibidaRef = useRef(false);



  //.......................................
  
  
  const toggleCalibrar = () => {
    socket.emit('control-cmd', { cmd: 'calibrar' });
  
  };
/*
socket.on('mision-descargada', (wpList) => {
  console.log("📦 Misión recibida del micro:", wpList);
  if (Array.isArray(wpList)) {
    setWaypoints(wpList);
    setEstadoCarga("cargada");
    setTimeout(() => setEstadoCarga(null), 5000);
  }
});
*/

// Función para enviar la misión
const handleConfirmEnviar = () => {
  setShowConfirmEnviar(false);
  setEstadoEnvio("enviando");

  socket.emit('control-cmd', {
    cmd: 'enviar-mision',
    data: waypoints
  });

  setTimeout(() => setEstadoEnvio("enviada"), 1000); // simulación
  setTimeout(() => setEstadoEnvio(null), 5000);
};

// Función para cargar la misión desde el micro
const handleConfirmCargar = () => {
  setShowConfirmCargar(false);
  setEstadoCarga("cargando");
  respuestaRecibidaRef.current = false;

  socket.emit('control-cmd', { cmd: 'solicitar-mision' });

  socket.once('mision-descargada', (wpList) => {
    respuestaRecibidaRef.current = true;

    if (Array.isArray(wpList)) {
      setWaypoints(wpList);
      setEstadoCarga("cargada");
    } else {
      setEstadoCarga("error");
    }

    setTimeout(() => setEstadoCarga(null), 5000);
  });

  setTimeout(() => {
    if (!respuestaRecibidaRef.current) {
      setEstadoCarga("error");
      setTimeout(() => setEstadoCarga(null), 5000);
    }
  }, 5000);
};




  // Función para agregar waypoint
  const handleAddWaypoint = () => {
    setShowWaypointForm(true);
    setNewWaypoint({ lat: '', lon: '' });
  };

  // Función para eliminar waypoint
  const handleDeleteWaypoint = () => {
    if (selectedWaypoint && selectedWaypoint.id !== 'Base') {
      setWaypoints(prev => {
        // Filtrar el waypoint eliminado
        const filteredWaypoints = prev.filter(wp => wp.id !== selectedWaypoint.id);
        
        // Reorganizar IDs de waypoints (excluyendo Base)
        const baseWaypoint = filteredWaypoints.find(wp => wp.id === 'Base');
        const otherWaypoints = filteredWaypoints.filter(wp => wp.id !== 'Base');
        
        // Renumerar waypoints secuencialmente
        const reorganizedWaypoints = otherWaypoints.map((wp, index) => ({
          ...wp,
          id: `WP${index + 1}`
        }));
        
        // Reconstruir array con Base al principio
        return baseWaypoint ? [baseWaypoint, ...reorganizedWaypoints] : reorganizedWaypoints;
      });
      setSelectedWaypoint(null);
    }
  };

  // Función para modificar waypoint
  const handleModifyWaypoint = () => {
    if (selectedWaypoint && selectedWaypoint.id !== 'Base') {
      setShowWaypointForm(true);
      setNewWaypoint({ 
        id: selectedWaypoint.id, 
        lat: selectedWaypoint.lat.toString(), 
        lon: selectedWaypoint.lon.toString() 
      });
    }
  };

  // Función para guardar waypoint (agregar o modificar)
  const handleSaveWaypoint = () => {
    if (newWaypoint.lat && newWaypoint.lon) {
      const lat = parseFloat(newWaypoint.lat);
      const lon = parseFloat(newWaypoint.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        if (selectedWaypoint && selectedWaypoint.id && selectedWaypoint.id !== 'Base') {
          // Modificar waypoint existente
          setWaypoints(prev => prev.map(wp =>
            wp.id === selectedWaypoint.id
              ? { ...wp, lat, lon }
              : wp
          ));
        } else {
          // Generar ID automático
          const wpCount = waypoints.filter(wp => wp.id.startsWith('WP')).length;
          const newId = `WP${wpCount + 1}`;
          setWaypoints(prev => [...prev, { id: newId, lat, lon }]);
        }
        setShowWaypointForm(false);
        setSelectedWaypoint(null);
        setNewWaypoint({ lat: '', lon: '' });
      }
    }
  };

  // Función para cancelar formulario
  const handleCancelForm = () => {
    setShowWaypointForm(false);
    setSelectedWaypoint(null);
    setNewWaypoint({ lat: '', lon: '' });
  };

  useEffect(() => {
  socket.on('telemetria', (data) => {
    try {
      const json = JSON.parse(data); 
     // console.log('mensaje recibido del backend : ',json);
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

  const enviarMision = () => {
  setEstadoEnvio("enviando");

  socket.emit('control-cmd', {
    cmd: 'enviar-mision',
    data: waypoints
  });

  // Simulación de confirmación exitosa
  setTimeout(() => setEstadoEnvio("enviada"), 1000);
  setTimeout(() => setEstadoEnvio(null), 5000);
};

const cargarMision = () => {
  setEstadoCarga("cargando");
  respuestaRecibidaRef.current = false;

  socket.emit('control-cmd', { cmd: 'solicitar-mision' });

  // Esperar respuesta del microcontrolador
  socket.once('mision-descargada', (wpList) => {
    respuestaRecibidaRef.current = true;

    if (Array.isArray(wpList)) {
      setWaypoints(wpList);
      setEstadoCarga("cargada");
    } else {
      setEstadoCarga("error");
    }

    setTimeout(() => setEstadoCarga(null), 5000);
  });

  // Si no responde, marcar error
  setTimeout(() => {
    if (!respuestaRecibidaRef.current) {
      setEstadoCarga("error");
      setTimeout(() => setEstadoCarga(null), 5000);
    }
  }, 5000);
};




  return (
    <div className="w-full flex flex-row">
      {/* Mitad izquierda: botones de waypoint */}
      <div className="w-1/4 flex flex-col justify-center ">
        <h2 className="font-semibold text-lg mb-2">Control de Misiòn</h2>

        {/* Selector de waypoint */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Editar Waypoints:
          </label>
          <select 
            value={selectedWaypoint?.id || ''} 
            onChange={(e) => {
              const wp = waypoints.find(w => w.id === e.target.value);
              setSelectedWaypoint(wp || null);
            }}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Seleccionar...</option>
            {waypoints.map(wp => (
              <option key={wp.id} value={wp.id}>{wp.id}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={handleAddWaypoint}
            className="bg-violet-500 text-white px-3 py-2 font-semibold rounded shadow-md transition-all duration-300 hover:bg-violet-600"
          >
            Agregar Waypoint
          </button>
          <button 
            onClick={handleDeleteWaypoint}
            disabled={!selectedWaypoint || selectedWaypoint.id === 'Base'}
            className="bg-red-500 text-white px-3 py-2 font-semibold rounded shadow-md transition-all duration-300 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Eliminar Waypoint
          </button>
          <button 
            onClick={handleModifyWaypoint}
            disabled={!selectedWaypoint || selectedWaypoint.id === 'Base'}
            className="bg-yellow-500 text-white px-3 py-2 font-semibold rounded shadow-md transition-all duration-300 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Modificar Waypoint
          </button>
        </div>

        {/* Formulario para agregar/modificar waypoint */}
        {showWaypointForm && (
          <div className="mt-4 p-3 bg-gray-100 rounded border">
            <h3 className="font-semibold text-sm mb-2">
              {selectedWaypoint && selectedWaypoint.id ? 'Modificar' : 'Agregar'} Waypoint
            </h3>
            <div className="space-y-2">
              <input
                type="number"
                step="0.0001"
                placeholder="Latitud"
                value={newWaypoint.lat}
                onChange={(e) => setNewWaypoint({...newWaypoint, lat: e.target.value})}
                className="w-full p-1 text-sm border rounded"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Longitud"
                value={newWaypoint.lon}
                onChange={(e) => setNewWaypoint({...newWaypoint, lon: e.target.value})}
                className="w-full p-1 text-sm border rounded"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveWaypoint}
                  className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                >
                  Guardar
                </button>
                <button
                  onClick={handleCancelForm}
                  className="bg-gray-500 text-white px-3 py-1 text-sm rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para ENVIAR misión */}
        {showConfirmEnviar && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Advertencia</h2>
              <p className="mb-4 text-gray-800">
                Se cargará el <strong>USV</strong> con la misión actual, reemplazando la misión que tiene cargada actualmente.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowConfirmEnviar(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmEnviar(false);
                    enviarMision(); // Llama a tu función real aquí
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para CARGAR misión */}
        {showConfirmCargar && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
              <h2 className="text-xl font-bold text-blue-600 mb-4">ℹ️ Atención</h2>
              <p className="mb-4 text-gray-800">
                Se cargará la misión que tiene el <strong>USV</strong> en este momento.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowConfirmCargar(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmCargar(false);
                    cargarMision(); // Llama a tu función real aquí
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      {/* Mitad derecha: botón de calibrado */}
        <div className="w-1/2 flex flex-col items-center justify-start space-y-4">
          <button
            onClick={() => setShowConfirm(true)}
            className={`px-4 py-2 font-semibold rounded shadow-md transition-all duration-300 ${
              calibrando ? 'bg-yellow-500' : calibrado ? 'bg-green-600' : 'bg-blue-500'
            } text-white`}
          >
            {calibrando ? 'Calibrando...' : calibrado ? 'Calibrado ✅' : 'Calibrar IMU'}
          </button>

          {showConfirm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
                <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Advertencia</h2>
                <p className="mb-4 text-gray-800">
                  Esta acción iniciará el proceso de calibrado completo de la IMU.<br />
                  El proceso durará aproximadamente <strong>1 minuto</strong> y no debe interrumpirse.
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      toggleCalibrar(); // llamá a tu función de calibracion
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
{/* Mitad derecha: botones de carga de mision */}




{/* Botón: Enviar Misión Actual */}
<button
  onClick={() => setShowConfirmEnviar(true)}
  className={`px-4 py-2 font-semibold rounded shadow-md transition-all duration-300 ${
    estadoEnvio === "enviada"
      ? "bg-green-600 hover:bg-green-700"
      : estadoEnvio === "enviando"
      ? "bg-yellow-500 hover:bg-yellow-600"
      : "bg-indigo-600 hover:bg-indigo-700"
  } text-white`}
>
  {estadoEnvio === "enviando"
    ? "⏳ Enviando..."
    : estadoEnvio === "enviada"
    ? "✅ Misión Enviada"
    : "Enviar Misión Actual"}
</button>

{showConfirmEnviar && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Advertencia</h2>
      <p className="mb-4 text-gray-800">
        Se cargará el USV con la misión actual <strong>reemplazando</strong> la misión que tiene cargada actualmente.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setShowConfirmEnviar(false)}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmEnviar}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Confirmar Envío
        </button>
      </div>
    </div>
  </div>
)}

<button
  onClick={() => setShowConfirmCargar(true)}
  className={`px-4 py-2 font-semibold rounded shadow-md transition-all duration-300 ${
    estadoCarga === "cargada"
      ? "bg-green-600 hover:bg-green-700"
      : estadoCarga === "cargando"
      ? "bg-yellow-500 hover:bg-yellow-600"
      : estadoCarga === "error"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-teal-600 hover:bg-teal-700"
  } text-white`}
>
  {estadoCarga === "cargando"
    ? "⏳ Solicitando..."
    : estadoCarga === "cargada"
    ? "✅ Misión Cargada"
    : estadoCarga === "error"
    ? "❌ Sin respuesta"
    : "Cargar Misión Actual"}
</button>

{showConfirmCargar && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Advertencia</h2>
      <p className="mb-4 text-gray-800">
        Se solicitará al USV la misión cargada actualmente. Esta <strong>reemplazará</strong> la misión visible en pantalla.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setShowConfirmCargar(false)}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmCargar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Confirmar Carga
        </button>
      </div>
    </div>
  </div>
)}







    </div>
  );
}
export default ControlPanel;
