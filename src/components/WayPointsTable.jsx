import React, { useState, useEffect } from 'react';
import useTelemetry from '../hooks/useTelemetry';
import '../style/NavigationTablero.css';
import '../style/WayPointsTable.css';


const WayPointsTable = ({
  currentPos,
  setCurrentPos,
  waypoints,
  setWaypoints,
  progressIdx,
  setProgressIdx,
  setSimBoatHeading,
  simulatedPath,
  setSimulatedPath
}) => {
  const [velocidad, setVelocidad] = useState(2000); // velocidad fija para simulación (km/h)
  const { telemetry } = useTelemetry();
  const [simulando, setSimulando] = useState(false);

 
  const rumbo = telemetry?.rumbo ?? 0;
  const lat = currentPos?.lat ?? telemetry?.lat ?? 0;
  const lon = currentPos?.lon ?? telemetry?.lon ?? 0;

  // Haversine en km
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function kmToNudos(distanciaKm) {
    return distanciaKm / 1.852;
  }

  function estimatedTime(distanceKm, speedKmh = 50) {
    return distanceKm / speedKmh;
  }

  function calculateHeading(lat1, lon1, lat2, lon2) {
    const toRad = deg => deg * Math.PI / 180;
    const toDeg = rad => rad * 180 / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    let brng = Math.atan2(y, x);
    brng = toDeg(brng);
    return (brng + 360) % 360;
  }

  // Simulación de movimiento del barco entre waypoints
useEffect(() => {
  let interval;
  if (simulando) {
    // Lista de destinos (excluye Base). El índice de progreso referencia esta lista.
    const destinos = waypoints.filter(
      w => typeof w.lat === 'number' && typeof w.lon === 'number' && !isNaN(w.lat) && !isNaN(w.lon) && w.id !== 'Base'
    );

    // Si no hay destinos, detener simulación
    if (destinos.length === 0) {
      setSimulando(false);
      if (setSimBoatHeading) setSimBoatHeading(null);
      return () => {};
    }

    let pos = { lat, lon };

    interval = setInterval(() => {
      // Si ya completamos todos los WP → detener
      if (progressIdx >= destinos.length) {
        setSimulando(false);
        clearInterval(interval);
        return;
      }

      const destino = destinos[progressIdx];
      if (!destino) return;

      // Distancia en km al destino actual
      const distKm = haversineDistance(pos.lat, pos.lon, destino.lat, destino.lon);

      // Calcular heading hacia el destino
      const heading = calculateHeading(pos.lat, pos.lon, destino.lat, destino.lon);
      if (setSimBoatHeading) setSimBoatHeading(heading);

      // Si llegamos cerca, quedarnos en el WP hasta confirmar manualmente
      if (!Number.isFinite(distKm) || distKm <= 0.0001 || distKm < 0.05) {
        pos = { lat: destino.lat, lon: destino.lon };
        setCurrentPos(pos);
        // No incrementamos progressIdx aquí: se hace solo con el botón "WayPoint Cumplido"
      } else {
        // Movimiento en función de la velocidad (km/h → km/s)
        const velKms = (velocidad / 3600)/10;
        const rawFrac = velKms / distKm;
        const frac = Math.max(0, Math.min(rawFrac, 1)); // clamp [0,1]

        pos = {
          lat: pos.lat + (destino.lat - pos.lat) * frac,
          lon: pos.lon + (destino.lon - pos.lon) * frac,
        };
        setCurrentPos(pos);

        setSimulatedPath(prev => [...prev, pos]);


      }
    }, 100); // actualiza cada 1 seg
  } else {
    if (setSimBoatHeading) setSimBoatHeading(null);
  }

  return () => clearInterval(interval);
}, [simulando, velocidad, waypoints, progressIdx]);


  function formatCoordinate(value, type) {
    if (typeof value !== 'number') return '--';
    const abs = Math.abs(value).toFixed(5);
    const dir = type === 'lat'
      ? value >= 0 ? 'N' : 'S'
      : value >= 0 ? 'E' : 'W';
    return `${abs}°${dir}`;
  }

  return (
    <div className="waypoints-table-container" style={{ background: '#64778aff', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="bg-black text-white p-4 rounded-lg shadow-lg w-full overflow-x-auto">
          <h2 className="text-center text-lg font-bold mb-4">Mi GPS</h2>
          <div className="flex justify-between items-center mb-2">
            <div className="bg-gray-800 text-white p-2 rounded text-sm">
              <div className="flex items-center gap-2">
                <span className="text font-bold">📍 Posición Actual:</span>
                <div className="flex gap-1">
                  <div className="flex items-center gap-1">
                    <span className=" text-xs text-white">{currentPos.lat >= 0 ? 'N' : 'S'}</span>
                    <span className=" bg-black border text-white w-24 text-sm px-1 py-1">{currentPos.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white">{currentPos.lon >= 0 ? 'E' : 'O'}</span>
                    <span className="bg-black border text-white w-24 text-sm px-1 py-1">{currentPos.lon.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="navBtns flex gap-2">
              <button
                className="bg-green-600 text-white px-3 py-2 rounded shadow hover:bg-green-700 transition text-sm"
                onClick={() => {
                  const wps = waypoints.filter(w => w.id !== 'Base');
                  if (progressIdx < wps.length) {
                    setProgressIdx(progressIdx + 1);
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
          {/* Contenedor scrollable para que no se tapen los WPs */}
          <div className="wp-scroll" style={{ maxHeight: '45vh', overflowY: 'auto', borderRadius: '0.5rem' }}>
            <table className="w-full text-sm border border-white" style={{ tableLayout: 'fixed' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr className="bg-gray-800">
                  <th className="border px-2 py-1 wp-th">WP</th>
                  <th className="border px-2 py-1 wp-th">LAT-LON</th>
                  <th className="border px-2 py-1 wp-th">DISTANCIA (nudos)</th>
                  <th className="border px-2 py-1 wp-th">TIEM. APROX. (h)</th>
                  <th className="border px-2 py-1 wp-th">ESTADO</th>
                </tr>
              </thead>
              <tbody className="wp-tbody">
              {(() => {
                const wps = waypoints.filter(
                  wp =>
                    wp.id !== 'Base' &&
                    typeof wp.lat === 'number' &&
                    typeof wp.lon === 'number' &&
                    !isNaN(wp.lat) &&
                    !isNaN(wp.lon)
                );
                const idToIdx = new Map(wps.map((w, i) => [w.id, i]));
                return waypoints.map((wp) => {
                  const realIdx = idToIdx.has(wp.id) ? idToIdx.get(wp.id) : -1;
                  let estado = '';
                  let color = '';
                  let rowBg = '';
                  if (wp.id === 'Base') {
                    estado = 'Base';
                    color = 'text-gray-400';
                    rowBg = 'bg-gray-800';
                  } else {
                    if (realIdx < progressIdx) {
                      estado = 'Completado';
                      color = 'text-green-500';
                      rowBg = 'bg-green-900/30';
                    } else if (realIdx === progressIdx) {
                      // Si el barco está en el WP, mostrar "Zona de llegada"
                      const distToWp = haversineDistance(lat, lon, wp.lat, wp.lon);
                      estado = distToWp < 0.05 ? 'Zona de llegada' : 'En camino';
                      color = distToWp < 0.05 ? 'text-yellow-400' : 'text-blue-500';
                      rowBg = distToWp < 0.05 ? 'bg-yellow-900/30' : 'bg-blue-900/30';
                    } else {
                      estado = 'Próximo destino';
                      color = 'text-red-500';
                      rowBg = 'bg-red-900/20';
                    }
                  }
                  let dist, distNudos, time;
                  if (wp.id === 'Base') {
                    dist = haversineDistance(lat, lon, wp.lat, wp.lon);
                    distNudos = kmToNudos(dist).toFixed(2);
                    time = estimatedTime(dist).toFixed(2);
                  } else {
                    if (realIdx < progressIdx) {
                      distNudos = '--';
                      time = '--';
                    } else {
                      dist = haversineDistance(lat, lon, wp.lat, wp.lon);
                      distNudos = kmToNudos(dist).toFixed(2);
                      time = estimatedTime(dist).toFixed(2);
                    }
                  }
                  return (
                    <tr key={wp.id} className={`text-center ${rowBg} wp-tr`}>
                      <td className="border px-2 py-1 wp-td">{wp.id}</td>
                      <td className="border px-2 py-1 wp-td">
                        {formatCoordinate(wp.lat, 'lat')}, {formatCoordinate(wp.lon, 'lon')}
                      </td>
                      <td className="border px-2 py-1 wp-td">{distNudos}</td>
                      <td className="border px-2 py-1 wp-td">{time}</td>
                      <td className={`border px-2 py-1 font-bold wp-td ${color}`}>{estado}</td>
                    </tr>
                  );
                });
              })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WayPointsTable;