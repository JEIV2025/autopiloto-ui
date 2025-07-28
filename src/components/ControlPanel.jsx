import React, { useState, useEffect  } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const ControlPanel = ({ waypoints, setWaypoints, currentPos, progressIdx, setProgressIdx }) => {
  const [calibrando, setCalibrando] = useState(false);
  const [calibrado, setCalibrado] = useState(false);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [showWaypointForm, setShowWaypointForm] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState({ lat: '', lon: '' });

  const toggleCalibrar = () => {
    socket.emit('control-cmd', { cmd: 'calibrar' });
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

        {/* Selector de waypoint */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar Waypoint:
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
