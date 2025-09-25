import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useTelemetry } from './TelemetryContext';

import '../style/NavigationTablero.css';

const WayPointsTable = ({currentPos, setCurrentPos, waypoints, setWaypoints, progressIdx, setProgressIdx }) => {

  const [velocidad, setVelocidad] = useState(12); // valor simulado inicial

  
  const { telemetry } = useTelemetry();

    // Simulación para el caso de que aún no haya datos
  const rumbo = telemetry?.rumbo ?? 0;
  const lat = telemetry?.lat ?? 0;
  const lon = telemetry?.lon ?? 0;


    useEffect(() => {
    console.log('📡 Datos actualizados waypointstable:', telemetry);
  }, [telemetry]);


// Función para calcular distancia con Haversine
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Tiempo estimado en horas
function estimatedTime(distanceKm, speedKmh = 50) {
  return distanceKm / speedKmh;
}


  // Manejar cambios de coordenadas
  const handleChange = (index, field, value) => {
    const updated = [...waypoints];
    updated[index][field] = parseFloat(value);
    setWaypoints(updated);
  };
// const [currentPos, setCurrentPos] = useState({ lat: -34.585, lon: -58.375 });

//const base = currentPos;

function formatCoordinate(value, type) {
  const abs = Math.abs(value).toFixed(4);
  if (type === 'lat') {
    return `${abs}° ${value >= 0 ? 'N' : 'S'}`;
  }
  if (type === 'lon') {
    return `${abs}° ${value >= 0 ? 'E' : 'O'}`;
  }
  return value;
}




  return (
    <div style={{background: '#64778aff', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
     
      <div style={{ flexShrink: 0 }}>
        <div className="bg-black text-white p-4 rounded-lg shadow-lg w-full overflow-x-auto">
          <h2 className="text-center text-lg font-bold mb-4">Mi GPS</h2>
            <div className="flex justify-between items-center mb-2">
              <div className="bg-gray-800 text-white p-2 rounded text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold">📍 Posición Actual:</span>
                  <div className="flex gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white">{currentPos.lat >= 0 ? 'N' : 'S'}</span>
                      <span className="bg-black border text-white w-24 text-sm px-1 py-1">{currentPos.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-white">{currentPos.lon >= 0 ? 'E' : 'O'}</span>
                      <span className="bg-black border text-white w-24 text-sm px-1 py-1">{currentPos.lon.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="bg-green-600 text-white px-3 py-2 rounded shadow hover:bg-green-700 transition text-sm"
                onClick={() => {
                  const wps = waypoints.filter(w => w.id !== 'Base');
                  if (progressIdx < wps.length) {
                    const nextWp = wps[progressIdx];
                    setProgressIdx(progressIdx + 1);                   // Marcar como cumplido
                    setCurrentPos({ lat: nextWp.lat, lon: nextWp.lon }); // Mover el barco al WP
                  }
                }}
              >
                ✅ WayPoint Cumplido
              </button>
            </div>

          <table className="w-full text-sm border border-white">
            <thead>
              <tr className="bg-gray-800">
                <th className="border px-2 py-1">WP</th>
                <th className="border px-2 py-1">LAT-LON</th>
                <th className="border px-2 py-1">DISTANCIA (km)</th>
                <th className="border px-2 py-1">TIEM. APROX. (h)</th>
                <th className="border px-2 py-1">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const wps = waypoints.filter(wp => wp.id !== 'Base' && typeof wp.lat === 'number' && typeof wp.lon === 'number' && !isNaN(wp.lat) && !isNaN(wp.lon));
                return waypoints.map((wp, idx) => {
                  let estado = '';
                  let color = '';
                  if (wp.id === 'Base') {
                    estado = 'Base';
                    color = 'text-gray-400';
                  } else {
                    // Buscar el índice real del waypoint (sin contar la base)
                    const realIdx = wps.findIndex(w => w.id === wp.id);
                    if (realIdx < progressIdx) {
                      estado = 'Completado';
                      color = 'text-green-500';
                    } else if (realIdx === progressIdx) {
                      estado = 'En camino';
                      color = 'text-blue-500';
                    } else {
                      estado = 'Próximo destino';
                      color = 'text-red-500';
                    }
                  }
                  let dist, time;
                  if (wp.id === 'Base') {
                    // Para la base siempre mostrar distancia desde posición actual
                    dist = haversineDistance(lat, lon, wp.lat, wp.lon).toFixed(2);
                    time = estimatedTime(parseFloat(dist)).toFixed(2);
                  } else {
                    // Buscar el índice real del waypoint (sin contar la base)
                    const realIdx = wps.findIndex(w => w.id === wp.id);
                    if (realIdx < progressIdx) {
                      // Waypoints completados: mostrar '--'
                      dist = '--';
                      time = '--';
                    } else {
                      // Waypoint actual y próximos destinos: calcular desde posición actual
                      dist = haversineDistance(lat, lon, wp.lat, wp.lon).toFixed(2);
                      time = estimatedTime(parseFloat(dist)).toFixed(2);
                    }
                  }
                  return (
                    <tr key={wp.id} className="text-center">
                      <td className="border px-2 py-1">{wp.id}</td>
                      <td className="border px-2 py-1">
                        {formatCoordinate(wp.lat, 'lat')}, {formatCoordinate(wp.lon, 'lon')}
                      </td>
                      <td className="border px-2 py-1">{dist}</td>
                      <td className="border px-2 py-1">{time}</td>
                      <td className={`border px-2 py-1 font-bold ${color}`}>{estado}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
     
      
    </div>
  );
};

export default WayPointsTable;