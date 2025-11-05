import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useTelemetry } from './TelemetryContext';
import { RadialGauge, LinearGauge } from 'canvas-gauges';
import '../style/NavigationTablero.css';

const NavigationTablero = ({waypoints, setWaypoints, progressIdx}) => {
 
  const [velocidad, setVelocidad] = useState(12); // valor simulado inicial

  
  const { telemetry } = useTelemetry();

    // Simulación para el caso de que aún no haya datos
  const rumbo = telemetry?.rumbo ?? 0;
  const roll = telemetry?.roll ?? 0;
  const rpm = telemetry?.rpm ?? 0;
  const bateria = telemetry?.bateria ?? 0;
  const temperatura = telemetry?.temperatura ?? 0;
  const lat = telemetry?.lat ?? 0;
  const lon = telemetry?.lon ?? 0;


    useEffect(() => {
    console.log('📡 Datos actualizados:', telemetry);
  }, [telemetry]);



  const termometerRef = useRef(null);
  const compassRef = useRef(null);
  const speedRef = useRef(null);
  const batteryRef = useRef(null);
  const rollRef = useRef(null);


  const termometerGaugeRef = useRef(null);
  const compassGaugeRef = useRef(null);
  const speedGaugeRef = useRef(null);
  const batteryGaugeRef = useRef(null);
  const rollGaugeRef = useRef(null);


    const [rotacionSuave, setRotacionSuave] = useState(rumbo);
  const rumboAnteriorRef = useRef(rumbo);

    // Montaje de gauges una sola vez – robusto ante StrictMode
useLayoutEffect(() => {
  

if (!termometerGaugeRef.current) {
termometerGaugeRef.current = new LinearGauge({
    renderTo: termometerRef.current,
    width: 90,
    height: 300,
    units: "°C",
    minValue: -20,
    startAngle: 90,
    ticksAngle: 180,
    valueBox: false,
    title: "Temperatura",
    maxValue: 90,
    majorTicks: [
        "-20",
        "-10",
        "0",
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90"
    ],
    minorTicks: 2,
    strokeTicks: true,
highlights: [
    {
        from: -20,
        to: 20,
        color: "rgba(0, 123, 255, 0.5)" // Azul claro = frío
    },
    {
        from: 20,
        to: 45,
        color: "rgba(40, 167, 69, 0.5)" // Verde = normal
    },
    {
        from: 45,
        to: 60,
        color: "rgba(255, 193, 7, 0.5)" // Amarillo = alerta
    },
    {
        from: 60,
        to: 75,
        color: "rgba(255, 87, 34, 0.5)" // Naranja = crítico
    },
    {
        from: 75,
        to: 90,
        color: "rgba(220, 53, 69, 0.5)" // Rojo = peligroso
    }
],

    colorPlate: "#fffdfdff",
    borderShadowWidth: 5,
    borders: true,
    needleType: "arrow",
    needleWidth: 2,
    needleCircleSize: 7,
    needleCircleOuter: true,
    needleCircleInner: false,
    animationDuration: 1500,
    animationRule: "linear",
    barWidth: 10,
    value: temperatura
}).draw();
}

if (!compassGaugeRef.current) {
compassGaugeRef.current = new RadialGauge({
  renderTo: compassRef.current,
  minValue: 0,
  maxValue: 360,
  width: 200,
  height: 200,
  majorTicks: ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"],
  valueBox: false,
  minorTicks: 22,
  ticksAngle: 360,
  startAngle: 180,
  strokeTicks: false,
  highlights: false,
  colorPlate: "#33a",
  colorMajorTicks: "#f5f5f5",
  colorMinorTicks: "#ddd",
  colorNumbers: "#ccc",
  colorNeedle: "rgba(240, 128, 128, 1)",
  colorNeedleEnd: "rgba(255, 160, 122, .9)",
  colorCircleInner: "#fff",
  colorNeedleCircleOuter: "#ccc",
  needleCircleSize: 15,
  needleCircleOuter: false,
  animationRule: "linear",
  animation: false,              // ✅ Desactivar animación para evitar saltos
  animationDuration: 0,         // ✅ Desactivar animación para evitar saltos
  needleType: "line",
  needleStart: 75,
  needleEnd: 99,
  needleWidth: 3,
  borders: true,
  borderOuterWidth: 10,
  colorBorderOuter: "#ccc",
  title: "RUMBO",
  fontTitleSize: 20,
  colorTitle: "#f5f5f5",
}).draw();
}

if (!speedGaugeRef.current) {
    speedGaugeRef.current = new RadialGauge({
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
      value: velocidad
    }).draw();
  }

  if (!batteryGaugeRef.current) {
    batteryGaugeRef.current =  new LinearGauge({
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
      value: bateria
    }).draw();
  }

   if (!rollGaugeRef.current) {
    rollGaugeRef.current =  new LinearGauge({
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
      value: roll
    }).draw();
  }



    return () => {
      termometerGaugeRef.current?.destroy?.();
      compassGaugeRef.current?.destroy?.();
      speedGaugeRef.current?.destroy?.();
      batteryGaugeRef.current?.destroy?.();
      rollGaugeRef.current?.destroy?.();
    };



  }, []);   
/*
      setTimeout(() => {
  termometerGaugeRef.current?.draw?.();
  compassGaugeRef.current?.draw?.();
  speedGaugeRef.current?.draw?.();
  batteryGaugeRef.current?.draw?.();
  rollGaugeRef.current?.draw?.();
}, 100); // incluso 200ms si querés asegurarte más
*/

useEffect(() => {
  if (termometerGaugeRef.current) termometerGaugeRef.current.value = temperatura;
  if (compassGaugeRef.current) compassGaugeRef.current.value = rumbo;
  if (speedGaugeRef.current) speedGaugeRef.current.value = telemetry?.velocidad ?? 12; // o una variable que represente eso
  if (batteryGaugeRef.current) batteryGaugeRef.current.value = bateria;
  if (rollGaugeRef.current) rollGaugeRef.current.value = roll;
}, [rumbo, roll, bateria, velocidad, temperatura]);





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

// DISTIRBUCION DE ELEMENTOS EN GRILLA DE TABLERO DE INSTURMENTOS. 
// LA DISTRIBUCION DE HACE EN TRES FILAS Y SIETE COLUMNAS
/*
Fila	Columna	Elemento
1-2	     2	  <canvas ref={termometerRef} />
1 	     3	  <canvas ref={compassRef} />
1	       4	  Rumbo (display)
1 	     5	  <canvas ref={speedRef} />
1-2	     6	  <canvas ref={batteryRef} />
2	      3-5	  <canvas ref={rollRef} />



*/

  return (
        <div className='instrumentos'style={{ background: '#64778aff', 
          border: '2px solid red',
        display: 'grid', 
        gridTemplateRows: '1fr 1fr 1fr', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '10px', 
        height: '100%', 
        borderRadius: '12px',
        border: '2px solid black',
        z: '0',
        padding: '10px' }}>

          {/* termometer */}
          <div className="gauge-container gauge-termometer" style={{ gridColumn: '2', gridRow: '1 / span 2', display: 'flex', justifyContent: 'center', alignItems: 'center', z: '50' }}>
            <canvas ref={termometerRef} />
          </div>

          {/* compass */}
          <div className="gauge-container gauge-compass" style={{ gridColumn: '3', gridRow: '1 ', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <canvas ref={compassRef} />
          </div>

          {/* rumbo */}
          <div 
            className="rumbo-container"
            style={{
              gridColumn: '4',
              gridRow: '1',
              backgroundColor: '#000',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '150px',
              height: '80%',
            }}
          >
            <p className="rumbo-label" style={{ color: 'yellow', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Rumbo
            </p>
            <p className="rumbo-value" style={{ color: 'yellow', fontSize: '48px', fontWeight: 'bold' }}>
              {rumbo.toFixed(2)}°
            </p>
          </div>

          {/* speed */}
          <div className="gauge-container gauge-speed" style={{ gridColumn: '5', gridRow: '1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <canvas ref={speedRef} />
          </div>

          {/* battery */}
          <div className="gauge-container gauge-battery" style={{ gridColumn: '6', gridRow: '1 / span 2', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <canvas ref={batteryRef} />
          </div>

          {/* roll */}
          <div className="gauge-container gauge-roll" style={{ gridColumn: '3 / span 3', gridRow: '2', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
            <canvas ref={rollRef} />
          </div>


        </div>

  );
};

export default NavigationTablero;


