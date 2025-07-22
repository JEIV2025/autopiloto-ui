import React, { useEffect, useRef, useState } from 'react';
import { RadialGauge, LinearGauge } from 'canvas-gauges';
import '../style/NavigationTablero.css';

const NavigationTablero = () => {
  const compassRef = useRef(null);
  const speedRef = useRef(null);
  const batteryRef = useRef(null);
  const rollRef = useRef(null);

  const [simData, setSimData] = useState({
    heading: 0,
    speed: 20,
    battery: 80,
    roll: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSimData(prev => ({
        heading: (prev.heading + 10) % 360,
        speed: Math.max(0, Math.min(50, prev.speed + (Math.random() * 4 - 2))),
        battery: Math.max(0, Math.min(100, prev.battery - 0.1)),
        roll: Math.max(-45, Math.min(45, prev.roll + (Math.random() * 6 - 3)))
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    new RadialGauge({
      renderTo: compassRef.current,
      width: 150,
      height: 150,
      units: "°",
      title: "Compass",
      minValue: 0,
      maxValue: 360,
      majorTicks: ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"],
      minorTicks: 22,
      strokeTicks: true,
      highlights: false,
      colorPlate: "#1a1a1a",
      colorMajorTicks: "#f0f0f0",
      colorMinorTicks: "#ccc",
      colorTitle: "#fff",
      colorUnits: "#fff",
      colorNumbers: "#eee",
      colorNeedle: "rgba(255,0,0,.75)",
      colorNeedleEnd: "#f00",
      valueBox: true,
      animationRule: "linear",
      animationDuration: 500,
      value: simData.heading
    }).draw();

    new RadialGauge({
      renderTo: speedRef.current,
      width: 200,
      height: 200,
      units: "knot/h",
      title: "Velocidad",
      minValue: 0,
      maxValue: 20,
      majorTicks: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
      minorTicks: 2,
      strokeTicks: true,
      highlights: [
        { from: 4, to: 8, color: "rgba(6, 201, 32, 0.5)" },
        { from: 8, to: 14, color: "rgba(255, 102, 0, 0.5)" },
        { from: 14, to: 20, color: "rgba(255,30,0,.5)" }
      ],
      colorPlate: "#111",
      colorMajorTicks: "#ddd",
      colorMinorTicks: "#999",
      colorTitle: "#fff",
      colorUnits: "#fff",
      colorNumbers: "#eee",
      colorNeedle: "#f00",
      colorNeedleEnd: "#f00",
      valueBox: true,
      animationRule: "linear",
      animationDuration: 500,
      value: simData.speed
    }).draw();

    new LinearGauge({
      renderTo: batteryRef.current,
      width: 80,
      height: 200,
      units: "%",
      title: "Batería",
      minValue: 0,
      maxValue: 100,
      majorTicks: [0, 20, 40, 60, 80, 100],
      minorTicks: 2,
      colorPlate: "#2e2e2e",
      colorBarProgress: "lime",
      colorBar: "#444",
      colorTitle: "#fff",
      colorUnits: "#fff",
      colorNumbers: "#eee",
      borders: false,
      barBeginCircle: false,
      value: simData.battery
    }).draw();

    new LinearGauge({
      renderTo: rollRef.current,
      width: 350,
      height: 120,
      units: "°",
      title: "Rolido",
      minValue: -50,
      maxValue: 50,
      majorTicks: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50],
      minorTicks: 5,
      strokeTicks: true,
      ticksWidth: 15,
      ticksWidthMinor: 7.5,
      highlights: [
        { from: -50, to: 0, color: "rgba(0,0, 255, .3)" },
        { from: 0, to: 50, color: "rgba(255, 0, 0, .3)" }
      ],
      colorMajorTicks: "#ffe66a",
      colorMinorTicks: "#ffe66a",
      colorTitle: "#eee",
      colorUnits: "#ccc",
      colorNumbers: "#eee",
      colorPlate: "#2465c0",
      colorPlateEnd: "#327ac0",
      borderShadowWidth: 0,
      borders: false,
      borderRadius: 10,
      needleType: "arrow",
      needleWidth: 3,
      animationDuration: 1500,
      animationRule: "linear",
      colorNeedle: "#222",
      colorNeedleEnd: "",
      colorBarProgress: "#327ac0",
      colorBar: "#f5f5f5",
      barStroke: 0,
      barWidth: 8,
      barBeginCircle: false,
      value: simData.roll
    }).draw();

  }, [simData]);


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


  const [waypoints, setWaypoints] = useState([
    { id: 'Base', lat: -34.58, lon: -58.38 },
    { id: 'P1', lat: -34.60, lon: -58.40 },
    { id: 'P2', lat: -34.62, lon: -58.42 }
  ]);

  // Manejar cambios de coordenadas
  const handleChange = (index, field, value) => {
    const updated = [...waypoints];
    updated[index][field] = parseFloat(value);
    setWaypoints(updated);
  };
const [currentPos, setCurrentPos] = useState({ lat: -34.585, lon: -58.375 });

const base = currentPos;

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
    <div className="flex flex-col items-center justify-center h-full bg-no-repeat bg-center bg-cover rounded-xl shadow" >
      {/* Fila 1 */}
           <div className="bg-black text-white p-4 rounded-lg shadow-lg w-full overflow-x-auto">
      <h2 className="text-center text-lg font-bold mb-4">Mi GPS</h2>

      <div className="bg-gray-800 text-white p-2 rounded mb-2 text-sm">
  <div className="flex items-center gap-2">
    <span className="font-bold">📍 Posición Actual:</span>

    <div className="flex flex-row gap-1">
  <div className="flex items-center gap-1">
    <span className="text-xs text-white">{currentPos.lat >= 0 ? 'N' : 'S'}</span>
    <input
      type="number"
      step="0.01"
      value={currentPos.lat}
      onChange={e => setCurrentPos({ ...currentPos, lat: parseFloat(e.target.value) })}
      className="bg-black border text-white w-24 text-sm px-1"
    />
  </div>
  <div className="flex items-center gap-1">
    <span className="text-xs text-white">{currentPos.lon >= 0 ? 'E' : 'O'}</span>
    <input
      type="number"
      step="0.01"
      value={currentPos.lon}
      onChange={e => setCurrentPos({ ...currentPos, lon: parseFloat(e.target.value) })}
      className="bg-black border text-white w-24 text-sm px-1"
    />
   
  </div>
</div>
  </div>
</div>

 <table className="w-full text-sm border border-white">
  
        <thead>
          <tr className="bg-gray-800">
            <th className="border px-2 py-1">WP</th>
            <th className="border px-2 py-1">LAT-LON</th>
            <th className="border px-2 py-1">DISTANCIA (km)</th>
            <th className="border px-2 py-1">TIEM. APROX. (h)</th>
          </tr>
        </thead>
        <tbody>
          {waypoints.map((wp, idx) => {
            const dist = idx === 0 ? '-' : haversineDistance(base.lat, base.lon, wp.lat, wp.lon).toFixed(2);
            const time = idx === 0 ? '-' : estimatedTime(dist).toFixed(2);
            return (
              <tr key={wp.id} className="text-center">
                <td className="border px-2 py-1">{wp.id}</td>
                <td className="border px-2 py-1">
                {formatCoordinate(wp.lat, 'lat')}, {formatCoordinate(wp.lon, 'lon')}

                </td>
                <td className="border px-2 py-1">{dist}</td>
                <td className="border px-2 py-1">{time}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

     <div className="flex flex-row justify-center gap-4">
        <canvas ref={compassRef} />
          <canvas ref={speedRef} />
        {/* <div className="flex flex-col items-center justify-center bg-black text-white p-4 rounded shadow">
          <div>📍 Lat: -34.60</div>
          <div>📍 Lon: -58.38</div>
          <div>⛵ Rumbo: {simData.heading.toFixed(0)}°</div>
        </div> */}
      </div>
      {/* Fila 2 */}
      <div className="flex flex-row justify-center items-center mt-4 gap-4">
        <canvas ref={rollRef} />
        <canvas ref={batteryRef} />
      </div>
    </div>
  );
};


export default NavigationTablero;


