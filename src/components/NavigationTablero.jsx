import React, { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import { useTelemetry } from './TelemetryContext';
import { RadialGauge, LinearGauge } from 'canvas-gauges';
import socket from '../socket';
import '../style/NavigationTablero.css';


const VolanteSVG = ({ angle = 0, value = 0 }) => {
  return (
    <div className="manualSvgGroup">
      <div className="manualSvgTitle">Volante</div>

      <svg
        className="manualSvgCanvas manualSvgWheel"
        viewBox="0 0 260 260"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="wheelPlate" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="70%" stopColor="#171717" />
            <stop offset="100%" stopColor="#0d0d0d" />
          </radialGradient>

          <linearGradient id="woodTone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8b27a" />
            <stop offset="50%" stopColor="#a77943" />
            <stop offset="100%" stopColor="#7c522e" />
          </linearGradient>

          <radialGradient id="hubTone" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#f8d39c" />
            <stop offset="60%" stopColor="#be8b4d" />
            <stop offset="100%" stopColor="#6f4924" />
          </radialGradient>

          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        <circle cx="130" cy="130" r="112" fill="url(#wheelPlate)" filter="url(#softShadow)" />
        <circle cx="130" cy="130" r="98" fill="none" stroke="#d9dde1" strokeWidth="18" />
        <circle cx="130" cy="130" r="87" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />

        <g transform={`rotate(${angle} 130 130)`}>
          <rect x="124" y="32" width="12" height="82" rx="7" fill="url(#woodTone)" />
          <rect x="124" y="146" width="12" height="82" rx="7" fill="url(#woodTone)" />
          <rect x="32" y="124" width="82" height="12" rx="7" fill="url(#woodTone)" />
          <rect x="146" y="124" width="82" height="12" rx="7" fill="url(#woodTone)" />

          <circle cx="130" cy="130" r="26" fill="url(#hubTone)" stroke="#5d3c1f" strokeWidth="6" />
          <circle cx="130" cy="130" r="8" fill="#f1d1a2" />
        </g>

        <circle cx="130" cy="130" r="118" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      </svg>

      <div className="manualSvgValue">
        Giro: <strong>{value}</strong>
      </div>
    </div>
  );
};

const PalancaSVG = ({ levelPct = 0, value = 0 }) => {
  const clamped = Math.max(0, Math.min(100, levelPct));
  const knobY = 210 - clamped * 1.55;

  return (
    <div className="manualSvgGroup">
      <div className="manualSvgTitle">Palanca</div>

      <svg
        className="manualSvgCanvas manualSvgLever"
        viewBox="0 0 180 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leverBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#223545" />
            <stop offset="100%" stopColor="#0d141b" />
          </linearGradient>

          <linearGradient id="leverMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e5e8ec" />
            <stop offset="100%" stopColor="#9aa4ad" />
          </linearGradient>

          <radialGradient id="leverKnob" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ff9d91" />
            <stop offset="55%" stopColor="#db4f3f" />
            <stop offset="100%" stopColor="#8c2318" />
          </radialGradient>

          <filter id="leverShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        <rect x="30" y="18" width="120" height="280" rx="24" fill="url(#leverBody)" filter="url(#leverShadow)" />
        <rect x="84" y="42" width="12" height="220" rx="6" fill="#79848d" opacity="0.85" />
        <rect x="82" y="78" width="16" height="158" rx="8" fill="url(#leverMetal)" />

        <g transform={`translate(0 ${knobY - 90})`}>
          <rect x="83" y="76" width="14" height="72" rx="7" fill="url(#leverMetal)" />
          <circle cx="90" cy="72" r="22" fill="url(#leverKnob)" stroke="#ffffff" strokeWidth="4" />
        </g>

        <rect x="52" y="274" width="76" height="14" rx="7" fill="rgba(255,255,255,0.12)" />
      </svg>

      <div className="manualSvgValue">
        Velocidad: <strong>{value}</strong>
      </div>
    </div>
  );
};


const NavigationTablero = ({waypoints, setWaypoints, progressIdx}) => {
 
  const [velocidad, setVelocidad] = useState(12); // valor simulado inicial

  const [manualMode, setManualMode] = useState(false);
  const [velocidadManual, setVelocidadManual] = useState('0');
  const [giroManual, setGiroManual] = useState('0');
  const seqRef = useRef(0);

  // Confirmación visual al enviar el comando de maniobra (sin depender 100% del back).
  const [manualSendStatus, setManualSendStatus] = useState({ type: 'idle', text: '' });

  //.... del joystick..............
const SPEED_STEPS = [-1000, -950, -900, -850, -750, -650, -550, -450, -350, -300, -100, 0, 100, 300, 350, 450, 550, 650, 750, 850, 900, 950, 1000];
const DEADZONE = 0.05;
const AXIS_THRESHOLD = 0.20;
const FORWARD_THRESHOLD = -0.20;
const JOYSTICK_TIMEOUT_MS = 500;
const SEND_INTERVAL_MS = 500;
const POLL_INTERVAL_MS = 50;
const ANGLE_STEP = 5;
const ANGLE_LIMIT = 90;
const CENTER_RESET_THRESHOLD = 0.10;

const leverActiveRef = useRef(false);
//const latchedSpeedRef = useRef(0);

const pollTimerRef = useRef(null);
const sendTimerRef = useRef(null);
const speedIndexRef = useRef(SPEED_STEPS.indexOf(0));
const prevL1Ref = useRef(false);
const prevR1Ref = useRef(false);
const rumboCmdRef = useRef(0);

const livePadRef = useRef({
  connected: false,
  id: '',
  x: 0,
  y: 0
});

/*
velocidadProgramada = lo que eliges con botones
velocidad = lo que realmente se envía al backend
*/
const [joystickData, setJoystickData] = useState({
  connected: false,
  updatedAt: null,
  cambioActual: 0,
  velocidadProgramada: 0,
  velocidad: 0,
  giro: 0,
  x: 0,
  y: 0,
  rumboObjetivo: 0,
  palancaActiva: false,
  enabled: false,
  id: ''
});

const { telemetry } = useTelemetry();

const lastTelemetryRef = useRef({
  rumbo: 0,
  roll: 0,
  rpm: 0,
  bateria: 0,
  temperatura: 0,
  lat: 0,
  lon: 0,
  velocidad: 0
});

const safeTelemetry = useMemo(() => {
  const prev = lastTelemetryRef.current;
  const next = { ...prev };

  if (telemetry && typeof telemetry === 'object') {
    for (const key of Object.keys(next)) {
      const value = telemetry[key];

      if (value !== undefined && value !== null && !Number.isNaN(Number(value))) {
        next[key] = Number(value);
      }
    }
  }

  lastTelemetryRef.current = next;
  return next;
}, [telemetry]);

const rumbo = safeTelemetry.rumbo;
const roll = safeTelemetry.roll;
const rpm = safeTelemetry.rpm;
const bateria = safeTelemetry.bateria;
const temperatura = safeTelemetry.temperatura;
const lat = safeTelemetry.lat;
const lon = safeTelemetry.lon;
const velocidadTelemetria = safeTelemetry.velocidad;


useEffect(() => {
  if (termometerGaugeRef.current) termometerGaugeRef.current.value = temperatura;
  if (compassGaugeRef.current) compassGaugeRef.current.value = rumbo;
  if (speedGaugeRef.current) speedGaugeRef.current.value = velocidadTelemetria;
  if (batteryGaugeRef.current) batteryGaugeRef.current.value = bateria;
  if (rollGaugeRef.current) rollGaugeRef.current.value = roll;
}, [rumbo, roll, bateria, temperatura, velocidadTelemetria]);


useEffect(() => {
  if (!manualMode) {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (sendTimerRef.current) {
      clearInterval(sendTimerRef.current);
      sendTimerRef.current = null;
    }

    return;
  }

pollTimerRef.current = setInterval(() => {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads && pads[0];

  if (!gp) {
    livePadRef.current = {
      connected: false,
      id: '',
      x: 0,
      y: 0
    };
    return;
  }

  const rawX = gp.axes?.[0] ?? 0;
  const rawY = gp.axes?.[1] ?? 0;

  const x = Math.abs(rawX) < DEADZONE ? 0 : rawX;
  const y = Math.abs(rawY) < DEADZONE ? 0 : rawY;

  const l1 = !!gp.buttons?.[4]?.pressed;
  const r1 = !!gp.buttons?.[5]?.pressed;

  if (r1 && !prevR1Ref.current) {
    speedIndexRef.current = Math.min(speedIndexRef.current + 1, SPEED_STEPS.length - 1);
  }

  if (l1 && !prevL1Ref.current) {
    speedIndexRef.current = Math.max(speedIndexRef.current - 1, 0);
  }

  prevL1Ref.current = l1;
  prevR1Ref.current = r1;

  livePadRef.current = {
    connected: true,
    id: gp.id || '',
    x: Number(x.toFixed(3)),
    y: Number(y.toFixed(3))
  };
}, POLL_INTERVAL_MS);

sendTimerRef.current = setInterval(() => {
  const { connected, x, y, id } = livePadRef.current;

  if (!connected) {
    leverActiveRef.current = false;

    setJoystickData((prev) => ({
      ...prev,
      connected: false,
      updatedAt: Date.now(),
      x: 0,
      y: 0,
      id: '',
      velocidad: 0,
      palancaActiva: false
    }));

    setManualSendStatus({
      type: 'warn',
      text: 'Joystick no detectado.'
    });

    return;
  }

  const velocidadProgramada = SPEED_STEPS[speedIndexRef.current];

const palancaAdelante = y <= FORWARD_THRESHOLD;
const giroActivo = Math.abs(x) >= AXIS_THRESHOLD;
const palancaCentrada = Math.abs(x) <= CENTER_RESET_THRESHOLD;

const palancaActiva = palancaAdelante || giroActivo;

leverActiveRef.current = palancaActiva;

const velocidadCmd = palancaActiva ? velocidadProgramada : 0;

// Si vuelves a "adelante recto", reinicia el rumbo a 0
if (palancaAdelante && palancaCentrada) {
  rumboCmdRef.current = 0;
} else if (x <= -AXIS_THRESHOLD) {
  rumboCmdRef.current = Math.max(rumboCmdRef.current - ANGLE_STEP, -ANGLE_LIMIT);
} else if (x >= AXIS_THRESHOLD) {
  rumboCmdRef.current = Math.min(rumboCmdRef.current + ANGLE_STEP, ANGLE_LIMIT);
}

  const payload = buildJoystickPayload(rumboCmdRef.current, velocidadCmd);

  socket.emit('joystick-cmd', payload);

  setJoystickData({
    connected: true,
    updatedAt: Date.now(),
    cambioActual: speedIndexRef.current,
    velocidadProgramada,
    velocidad: velocidadCmd,
    giro: rumboCmdRef.current,
    x,
    y,
    rumboObjetivo: rumboCmdRef.current,
    palancaActiva,
    enabled: true,
    id
  });

  setVelocidadManual(String(velocidadProgramada));
  setGiroManual(String(rumboCmdRef.current));

  setManualSendStatus({
    type: 'ok',
    text: `Joystick activo | vel. configurada ${velocidadProgramada} | vel. enviada ${velocidadCmd} | giro ${rumboCmdRef.current}°`
  });
}, SEND_INTERVAL_MS);

  return () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (sendTimerRef.current) {
      clearInterval(sendTimerRef.current);
      sendTimerRef.current = null;
    }
  };
}, [manualMode]);
  //...................................



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

const handleControlManual = () => {
  alert('advertencia al pasar a control manual se desactiva la mision actual');

  speedIndexRef.current = SPEED_STEPS.indexOf(0);
  prevL1Ref.current = false;
  prevR1Ref.current = false;
  rumboCmdRef.current = 0;
  leverActiveRef.current = false;
  //latchedSpeedRef.current = 0;

  setManualMode(true);
  setVelocidadManual('0');
  setGiroManual('0');

  setJoystickData({
    connected: false,
    updatedAt: Date.now(),
    cambioActual: SPEED_STEPS.indexOf(0),
    velocidadProgramada: 0,
    velocidad: 0,
    giro: 0,
    x: 0,
    y: 0,
    rumboObjetivo: 0,
    palancaActiva: false,
    enabled: true,
    id: ''
  });

  const payload = buildJoystickPayload(0, 0);

  socket.emit('joystick-cmd', payload, (ack) => {
    if (ack?.ok) {
      setManualSendStatus({
        type: 'ok',
        text: 'Control manual habilitado | rumbo 0 | velocidad 0'
      });
    } else {
      setManualSendStatus({
        type: 'warn',
        text: 'Control manual habilitado, pero no se pudo enviar al backend.'
      });
    }
  });
};

  const handleEnviarManual = () => {
    const vel = parseFloat(velocidadManual);
    const giro = parseFloat(giroManual);

    if (isNaN(vel) || isNaN(giro)) {
      alert('Ingrese valores numéricos válidos para velocidad y giro');
      return;
    }

    seqRef.current += 1;
    const seq = seqRef.current;

    setManualSendStatus({ type: 'sending', text: `Enviando maniobrar (seq ${seq})...` });

    const payload = {
      cmd: 'maniobrar',
      seq,
      mode: 'manual',
      enable: 1,
      // Enviamos ambas llaves para compatibilidad con backend
      // (en tu código original era `velcidad`, pero en algunas partes podría esperarse `velocidad`).
      velcidad: vel,
      velocidad: vel,
      giro: giro,
      'timeout-ms': 500
    };
    // Log reducido (sin volcar todo el paquete) para verificar que el click manda.
    console.log('➡️ emit maniobrar-cmd:', { seq: payload.seq, vel: payload.velcidad, giro: payload.giro });

    // Si el servidor implementa ack de Socket.IO, esto nos permite confirmar recepción.
    let ackReceived = false;
    const ackTimeoutMs = 3000;
    const timeoutId = setTimeout(() => {
      if (!ackReceived) {
        setManualSendStatus({
          type: 'warn',
          text: `Sin ack del servidor (seq ${seq}).`
        });
      }
    }, ackTimeoutMs);

    // Dejamos que React pinte el estado "sending" antes de emitir (algunos acks llegan demasiado rápido).
    setTimeout(() => {
      socket.emit('maniobrar-cmd', payload, (ack) => {
        ackReceived = true;
        clearTimeout(timeoutId);
        setManualSendStatus({
          type: 'ok',
          text: `Ack del servidor (seq ${seq}).`
        });
      });
    }, 0);
  };


const handleVolverATablero = () => {
  if (pollTimerRef.current) {
    clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
  }

  if (sendTimerRef.current) {
    clearInterval(sendTimerRef.current);
    sendTimerRef.current = null;
  }

  const payload = {
    cmd: 'joystick',
    data: {
      rumbo: 0,
      velocidad: 0,
      seq: ++seqRef.current,
      mode: 'manual',
      enable: 0,
      timeout_ms: JOYSTICK_TIMEOUT_MS
    }
  };

  socket.emit('joystick-cmd', payload);

  speedIndexRef.current = SPEED_STEPS.indexOf(0);
  prevL1Ref.current = false;
  prevR1Ref.current = false;
  rumboCmdRef.current = 0;
  leverActiveRef.current = false;
 // latchedSpeedRef.current = 0;

  livePadRef.current = {
    connected: false,
    id: '',
    x: 0,
    y: 0
  };

  setManualMode(false);
  setVelocidadManual('0');
  setGiroManual('0');
  setManualSendStatus({ type: 'idle', text: 'Modo automático.' });

  setJoystickData({
    connected: false,
    updatedAt: Date.now(),
    cambioActual: SPEED_STEPS.indexOf(0),
    velocidadProgramada: 0,
    velocidad: 0,
    giro: 0,
    x: 0,
    y: 0,
    rumboObjetivo: 0,
    palancaActiva: false,
    enabled: false,
    id: ''
  });
};
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

const volanteDeg = Math.max(
  -135,
  Math.min(135, (Number(joystickData.giro || 0) / 90) * 135)
);

const palancaPct = Math.max(
  0,
  Math.min(100, ((Number(joystickData.velocidad || 0) + 1000) / 2000) * 100)
);

const volanteVisualDeg = manualMode ? volanteDeg : 0;
const palancaVisualPct = manualMode ? palancaPct : 0;

function normalize360(value) {
  let v = value % 360;
  if (v < 0) v += 360;
  return v;
}

function applyDeadzone(value, deadzone = DEADZONE) {
  return Math.abs(value) < deadzone ? 0 : value;
}

function buildJoystickPayload(rumboCmd, velocidadCmd) {
  seqRef.current += 1;

  return {
    cmd: 'joystick',
    data: {
      rumbo: Math.round(rumboCmd),
      velocidad: Math.round(velocidadCmd),
      seq: seqRef.current,
      mode: 'manual',
      enable: 1,
      timeout_ms: JOYSTICK_TIMEOUT_MS
    }
  };
}

function emitJoystickCommand(payload, onOk) {
  socket.emit('joystick-cmd', payload, (ack) => {
    if (ack?.ok) {
      onOk?.();
    }
  });
}


return (
  <div className="navigationTableroRoot">
    <div className="instrumentos" >
      {/* termometer */}
      <div
        className="gauge-container gauge-termometer"
        style={{
          gridColumn: '2',
          gridRow: '1 / span 2',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <canvas ref={termometerRef} />
      </div>

      {/* compass */}
      <div
        className="gauge-container gauge-compass"
        style={{
          gridColumn: '3',
          gridRow: '1',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
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
          height: '80%'
        }}
      >
        <p
          className="rumbo-label"
          style={{
            color: 'yellow',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}
        >
          Rumbo
        </p>
        <p
          className="rumbo-value"
          style={{
            color: 'yellow',
            fontSize: '48px',
            fontWeight: 'bold'
          }}
        >
          {rumbo.toFixed(2)}°
        </p>
      </div>

      {/* speed */}
      <div
        className="gauge-container gauge-speed"
        style={{
          gridColumn: '5',
          gridRow: '1',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <canvas ref={speedRef} />
      </div>

      {/* battery */}
      <div
        className="gauge-container gauge-battery"
        style={{
          gridColumn: '6',
          gridRow: '1 / span 2',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <canvas ref={batteryRef} />
      </div>

      {/* roll */}
      <div
        className="gauge-container gauge-roll"
        style={{
          gridColumn: '3 / span 3',
          gridRow: '2',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80%'
        }}
      >
        <canvas ref={rollRef} />
      </div>

      {/* sector manual inferior */}
      <div
        className="manualDock"
        style={{
          gridColumn: '2 / span 5',
          gridRow: '3'
        }}
      >
        <div className={`manualDockCard ${manualMode ? 'active' : 'disabled'}`}>
          {manualMode && (
            <button className="manualDockAutoBtn" onClick={handleVolverATablero}>
              volver automático
            </button>
          )}

          <div className="manualDockVisuals">
            <VolanteSVG angle={volanteVisualDeg} value={joystickData.giro} />
            <PalancaSVG levelPct={palancaVisualPct} value={joystickData.velocidad} />
          </div>

          <div className="manualDockReadout">
            <div className="manualDockInputs">
              <label className="manualDockLabel">
                Velocidad
                <input
                  className="manualDockInput"
                  type="number"
                  step="any"
                  value={velocidadManual}
                  readOnly
                />
              </label>

              <label className="manualDockLabel">
                Giro
                <input
                  className="manualDockInput"
                  type="number"
                  step="any"
                  value={giroManual}
                  readOnly
                />
              </label>
            </div>

            <div
              className={`manualDockStatus ${joystickData.connected ? 'ok' : 'warn'}`}
              role="status"
              aria-live="polite"
            >
              {joystickData.connected
                ? `Joystick conectado | Cambio ${joystickData.cambioActual} | MotorL ${joystickData.motorL} | MotorR ${joystickData.motorR}`
                : 'Joystick desconectado'}
            </div>

            {manualSendStatus.text && (
              <div
                className={`manualDockStatus ${manualSendStatus.type}`}
                role="status"
                aria-live="polite"
              >
                {manualSendStatus.text}
              </div>
            )}
          </div>

          {!manualMode && (
            <div className="manualDockOverlay">
              <button className="manualDockEnableBtn" onClick={handleControlManual}>
                control manual
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default NavigationTablero;


