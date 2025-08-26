import React, { useEffect, useRef, useState } from 'react';
import { RadialGauge, LinearGauge } from 'canvas-gauges';
import '../style/NavigationTablero.css';

import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const NavigationTablero = () => {
  const compassRef = useRef(null);
  const speedRef = useRef(null);
  const batteryRef = useRef(null);
  const rollRef = useRef(null);

  const [yaw, setYaw] = useState(0);
  const [roll, setRoll] = useState(0);
  const [pitch, setPitch] = useState(0); 


  
 useEffect(() => {
    socket.on('telemetria', (data) => {
      try {
        const json = JSON.parse(data); 
      //  console.log('mensaje recibido del backend : ',json);
          if (typeof json.yaw === 'number') {
            setYaw(json.yaw);
          }
  
          if (typeof json.roll === 'number') {
            setRoll(json.roll);
          }
          if (typeof json.pitch === 'number') {
            setPitch(json.pitch);
          }
      } catch (e) {
        console.error('❌ Error parsing JSON:', e);
      }
    });
  
    return () => {
      socket.off('telemetria');
    };
  }, []);

//... para hacerlo aleatorio.....
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
//...........................................................

const adjustedYaw = (yaw + 360) % 360;

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
      value: adjustedYaw // asegura valor 0–360
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
      value: pitch
    }).draw();

  }, [simData]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-no-repeat bg-center bg-cover rounded-xl shadow" >
      {/* Fila 1 */}
      <div className="flex flex-row justify-center gap-4">
        <canvas ref={compassRef} />
        <canvas ref={speedRef} />
        <div className="flex flex-col items-center justify-center bg-black text-white p-4 rounded shadow">
          <div>📍 Lat: -34.60</div>
          <div>📍 Lon: -58.38</div>
          <div>⛵ Rumbo: {simData.heading.toFixed(0)}°</div>
        </div>
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


