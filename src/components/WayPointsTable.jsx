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


// Función para calcular distancia con Haversine (en km)
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

// Nueva función: convierte distancia en km a nudos
function kmToNudos(distanciaKm) {
  return distanciaKm / 1.852;
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

const [simulando, setSimulando] = useState(false);
const [simulatedPath, setSimulatedPath] = useState([]);

// Simulación de navegación aleatoria entre WP
useEffect(() => {
  let interval;
  if (simulando) {
    let idx = progressIdx;
    let path = [{ lat: lat, lon: lon }];
    interval = setInterval(() => {
      const wps = waypoints.filter(w => w.id !== 'Base');
      if (idx >= wps.length) {
        setSimulando(false);
        clearInterval(interval);
        return;
      }
      const destino = wps[idx];
      // Movimiento aleatorio hacia el WP
      const deltaLat = (destino.lat - lat) * (Math.random() * 0.2 + 0.1);
      const deltaLon = (destino.lon - lon) * (Math.random() * 0.2 + 0.1);
      const nuevoLat = path[path.length - 1].lat + deltaLat;
      const nuevoLon = path[path.length - 1].lon + deltaLon;
      path.push({ lat: nuevoLat, lon: nuevoLon });
      setSimulatedPath([...path]);
      // Si está cerca del destino, avanza al siguiente WP
      if (haversineDistance(nuevoLat, nuevoLon, destino.lat, destino.lon) < 0.05) {
        idx++;
        setProgressIdx(idx);
        setCurrentPos({ lat: destino.lat, lon: destino.lon });
      }
    }, 700);
  } else {
    setSimulatedPath([]);
  }
  return () => clearInterval(interval);
  // eslint-disable-next-line
}, [simulando]);

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

              <div className="flex gap-2">
                <button
                  className="bg-green-600 text-white px-3 py-2 rounded shadow hover:bg-green-700 transition text-sm"
                  onClick={() => {
                    const wps = waypoints.filter(w => w.id !== 'Base');
                    if (progressIdx < wps.length) {
                      const nextWp = wps[progressIdx];
                      setProgressIdx(progressIdx + 1);
                      setCurrentPos({ lat: nextWp.lat, lon: nextWp.lon });
                    }
                  }}
                >
                  ✅ WayPoint Cumplido
                </button>
                <button
                  className={`px-3 py-2 rounded shadow text-sm ${simulando ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition`}
                  onClick={() => setSimulando(!simulando)}
                >
                  {simulando ? 'Detener Simulación' : 'Simular Navegación'}
                </button>
              </div>
            </div>

          {/* Representación visual de la simulación */}
          {simulando && simulatedPath.length > 1 && (
            <div className="my-4">
              <h3 className="text-center text-md font-semibold mb-2">Recorrido Simulado</h3>
              <svg width="100%" height="60" style={{ background: '#222', borderRadius: 8 }}>
                {simulatedPath.map((p, i) => {
                  if (i === 0) return null;
                  const prev = simulatedPath[i - 1];
                  // Escalado simple para mostrar el recorrido
                  const scale = 4000;
                  const x1 = 30 + (prev.lon - waypoints[0].lon) * scale;
                  const y1 = 30 - (prev.lat - waypoints[0].lat) * scale;
                  const x2 = 30 + (p.lon - waypoints[0].lon) * scale;
                  const y2 = 30 - (p.lat - waypoints[0].lat) * scale;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#00eaff"
                      strokeDasharray="4"
                      strokeWidth="3"
                      opacity={0.7}
                    />
                  );
                })}
                {/* Marca el barco */}
                {simulatedPath.length > 0 && (
                  <circle
                    cx={30 + (simulatedPath[simulatedPath.length - 1].lon - waypoints[0].lon) * 4000}
                    cy={30 - (simulatedPath[simulatedPath.length - 1].lat - waypoints[0].lat) * 4000}
                    r="6"
                    fill="#00eaff"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                )}
              </svg>
              <div className="text-center text-xs text-blue-300 mt-1">Recorrido simulado (línea punteada)</div>
            </div>
          )}

          <table className="w-full text-sm border border-white">
            <thead>
              <tr className="bg-gray-800">
                <th className="border px-2 py-1">WP</th>
                <th className="border px-2 py-1">LAT-LON</th>
                <th className="border px-2 py-1">DISTANCIA (nudos)</th>
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
                  let dist, distNudos, time;
                  if (wp.id === 'Base') {
                    // Para la base siempre mostrar distancia desde posición actual
                    dist = haversineDistance(lat, lon, wp.lat, wp.lon);
                    distNudos = kmToNudos(dist).toFixed(2);
                    time = estimatedTime(dist).toFixed(2);
                  } else {
                    // Buscar el índice real del waypoint (sin contar la base)
                    const realIdx = wps.findIndex(w => w.id === wp.id);
                    if (realIdx < progressIdx) {
                      // Waypoints completados: mostrar '--'
                      distNudos = '--';
                      time = '--';
                    } else {
                      // Waypoint actual y próximos destinos: calcular desde posición actual
                      dist = haversineDistance(lat, lon, wp.lat, wp.lon);
                      distNudos = kmToNudos(dist).toFixed(2);
                      time = estimatedTime(dist).toFixed(2);
                    }
                  }
                  return (
                    <tr key={wp.id} className="text-center">
                      <td className="border px-2 py-1">{wp.id}</td>
                      <td className="border px-2 py-1">
                        {formatCoordinate(wp.lat, 'lat')}, {formatCoordinate(wp.lon, 'lon')}
                      </td>
                      <td className="border px-2 py-1">{distNudos}</td>
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