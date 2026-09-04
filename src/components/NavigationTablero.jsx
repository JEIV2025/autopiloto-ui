import React, { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import { useTelemetry } from './TelemetryContext';
import { RadialGauge, LinearGauge } from 'canvas-gauges';
import socket from '../socket';
import '../style/NavigationTablero.css';
import '../style/Instrumentos.css';

import { BatteryLevel } from "../instrumentos/BatteryLevel";
import { TempLevel } from "../instrumentos/TempLevel";
import IndicadorTelemetria from "../instrumentos/IndicadorTelemetria";
import { AltitudeVario } from "../instrumentos/AltitudeVario";
import { AttitudeIndicator } from "../instrumentos/AttitudeIndicator";
import { LidarRange } from "../instrumentos/LidarRange";
import { RollInclinometer } from "../instrumentos/RollInclinometer";
import { LeftStickSVG, RightStickSVG } from "../instrumentos/JoystickStickSVG";

import BotonEmergencia from "../instrumentos/BotonEmergencia";
import  VolanteSVG  from "../instrumentos/VolanteSVG";
import  PalancaSVG  from "../instrumentos/PalancaSVG";
import switchImg from "../images/switch.png";


const NavigationTablero = ({waypoints, 
                            setWaypoints, 
                            progressIdx,
                            mode,
                            setMode,
                            distanciasSeguridad
                          }) => {
 

  //const [mode, setMode] = useState(() => localStorage.getItem("dashboardMode") || "superficie");
  const isAereo = mode === "aereo";
  useEffect(() => {
    localStorage.setItem("dashboardMode", mode);
  }, [mode]);

  const [velocidad, setVelocidad] = useState(12); // valor simulado inicial

  const [manualMode, setManualMode] = useState(false);
  const [velocidadManual, setVelocidadManual] = useState('0');
  const [giroManual, setGiroManual] = useState('0');
  const seqRef = useRef(0);

  // Confirmación visual al enviar el comando de maniobra (sin depender 100% del back).
  const [manualSendStatus, setManualSendStatus] = useState({ type: 'idle', text: '' });


  //.... del joystick..............
const SPEED_STEPS = [0, 100, 300, 350, 450, 550, 650, 750, 850, 900, 950, 1000];
const DEADZONE = 0.05;
const AXIS_THRESHOLD = 0.20;
const FORWARD_THRESHOLD = -0.20;
const JOYSTICK_TIMEOUT_MS = 500;
const SEND_INTERVAL_MS = 500; //intervalo de envio por telemetria
const POLL_INTERVAL_MS = 50;
const ANGLE_STEP = 5;
const ANGLE_LIMIT = 90;
const CENTER_RESET_THRESHOLD = 0.10;
const SPEED_AXIS_STEP_THRESHOLD = 0.65; // Ru/Rd (stick derecho Y)
const K_GIRO = 0.5;
const leverActiveRef = useRef(false);
//const latchedSpeedRef = useRef(0);

const RU_BTN = 0; // Ru
const RD_BTN = 2; // Rd
const RL_BTN = 3; // Rl (por si luego lo querés)
const RR_BTN = 1; // Rr (por si luego lo querés)

const pollTimerRef = useRef(null);
const sendTimerRef = useRef(null);
const speedIndexRef = useRef(SPEED_STEPS.indexOf(0));
const prevL1Ref = useRef(false);
const prevR1Ref = useRef(false);
const rumboCmdRef = useRef(0);

const livePadRef = useRef({
  connected: false,
  id: "",
  // Stick izquierdo (axes 0/1)
  x: 0,
  y: 0,
  // Stick derecho (axes 2/3)
  rx: 0,
  ry: 0,

  // UAV (normalizados: arriba positivo)
  Lx: 0,
  Ly: 0,
  Rx: 0,
  Ry: 0,

  // Ru/Rd para speed steps (stick derecho arriba/abajo)
  ru: false,
  rd: false,

  // Cámara (botones)
  l1: false,
  r1: false,
  l2: 0,   // value 0..1
  r2: 0
});
const prevRuRef = useRef(false);
const prevRdRef = useRef(false);

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
  id: '',
  Lx: 0,
  Ly: 0,
  Rx: 0,
  Ry: 0
});

const { telemetry } = useTelemetry();

const lastTelemetryRef = useRef({
  rumbo: 0,
  roll: 0,
  pitch: 0,
  rpm: 0,
  bateria: 0,
  temperatura: 0,
  lat: 0,
  lon: 0,
  velocidad: 0,
  altura: 0,
  distancia: 0,
  distmin: 40,
  distmax: 200,
  presion: 0,

  misionActiva: false,
  wpActual: "Inicio",
  wpIndex: 0,
  wpTotal: 0,
  distanciaWP: 0,
  rumboObjetivo: 0,
  errorRumbo: 0,
  giroCmd: 0,
  velocidadCmd: 0,
  gpsReal: false,
  alturaObjetivo: 0,
  errorAltura: 0
});

const [telemetriaLink, setTelemetriaLink] = useState({
  calidad: 100,
  recibidos: 0,
  perdidos: 0
});

useEffect(() => {
  socket.on("telemetria_link", (data) => {
    setTelemetriaLink(data);
  });

  return () => {
    socket.off("telemetria_link");
  };
}, []);

const safeTelemetry = useMemo(() => {
  const prev = lastTelemetryRef.current;
  const next = { ...prev };

  if (telemetry && typeof telemetry === 'object') {
    for (const key of Object.keys(next)) {
      const value = telemetry[key];

      if (value === undefined || value === null) continue;

      if (typeof next[key] === "boolean") {
        next[key] = Boolean(value);
      } else if (typeof next[key] === "string") {
        next[key] = String(value);
      } else if (!Number.isNaN(Number(value))) {
        next[key] = Number(value);
      }
    }
  }

  lastTelemetryRef.current = next;
  return next;
}, [telemetry]);

const rumbo = safeTelemetry.rumbo;
const roll = safeTelemetry.roll;
const pitch = safeTelemetry.pitch; 
const rpm = safeTelemetry.rpm;
const bateria = safeTelemetry.bateria;
const temperatura = safeTelemetry.temperatura;
const lat = safeTelemetry.lat;
const lon = safeTelemetry.lon;
const altura = safeTelemetry.altura;

const distancia = safeTelemetry.distancia;
const presion = safeTelemetry.presion;

const velocidadTelemetria = safeTelemetry.velocidad;
//... datos de mision de autopiloto................
const misionActiva = safeTelemetry.misionActiva;
const wpActual = safeTelemetry.wpActual;
const wpIndex = safeTelemetry.wpIndex;
const wpTotal = safeTelemetry.wpTotal;
const distanciaWP = safeTelemetry.distanciaWP;
const rumboObjetivo = safeTelemetry.rumboObjetivo;
const errorRumbo = safeTelemetry.errorRumbo;
const giroCmd = safeTelemetry.giroCmd;
const velocidadCmd = safeTelemetry.velocidadCmd;
const gpsReal = safeTelemetry.gpsReal;
const alturaObjetivo = safeTelemetry.alturaObjetivo;
const errorAltura = safeTelemetry.errorAltura;
//..................................................
const distCritica = distanciasSeguridad?.distmin ?? safeTelemetry.distmin ?? 40;
const distSeguridad = distanciasSeguridad?.distmax ?? safeTelemetry.distmax ?? 200;

let estadoDistancia = 'segura';

if (distancia <= distCritica) {
  estadoDistancia = 'critica';
} else if (distancia <= distSeguridad) {
  estadoDistancia = 'alerta';
}

const isAereoRef = useRef(isAereo);
useEffect(() => { isAereoRef.current = isAereo; }, [isAereo]);



const lastAltRef = useRef({ alt: 0, t: 0, vz: 0 });
const [vario, setVario] = useState(0);
useEffect(() => {
  // usá timestamp si viene en ms; si no, usa Date.now()
  const t = Number(safeTelemetry.timestamp);
  const alt = Number(altura) || 0;

  const prev = lastAltRef.current;
  const dt = (t - prev.t) / 1000; // s

  if (prev.t > 0 && dt > 0.02 && dt < 1.0) {
    const vz = (alt - prev.alt) / dt;
    const vzFilt = prev.vz * 0.8 + vz * 0.2;
    lastAltRef.current = { alt, t, vz: vzFilt };
    setVario(vzFilt);
  } else {
    lastAltRef.current = { alt, t, vz: prev.vz };
  }
}, [altura, safeTelemetry.timestamp]);

//......display correccion rumbo ...........

const correccionRumbo = Math.abs(errorRumbo);
const necesitaIzquierda = errorRumbo < -2;
const necesitaDerecha = errorRumbo > 2;
const rumboEnVia = misionActiva && Math.abs(errorRumbo) <= 2;

const correccionAltura = Math.abs(errorAltura);
const necesitaSubir = errorAltura > 5;
const necesitaBajar = errorAltura < -5;
const alturaEnVia = misionActiva && Math.abs(errorAltura) <= 5;
//..........................................


useEffect(() => {
 // if (termometerGaugeRef.current) termometerGaugeRef.current.value = temperatura;
  if (compassGaugeRef.current) compassGaugeRef.current.value = rumbo;
  if (speedGaugeRef.current) speedGaugeRef.current.value = velocidadTelemetria;
 // if (batteryGaugeRef.current) batteryGaugeRef.current.value = bateria;
  if (rollGaugeRef.current) rollGaugeRef.current.value = roll;
}, [rumbo, roll, velocidadTelemetria, altura]);


useEffect(() => {
  if (!manualMode) {
    // si saliste del modo manual, por las dudas limpia refs (opcional)
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
    if (sendTimerRef.current) clearInterval(sendTimerRef.current);
    sendTimerRef.current = null;
    return;
  }


pollTimerRef.current = setInterval(() => {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = Array.from(pads).find((p) => p && p.connected) || null;

  if (!gp) {
    livePadRef.current = {
      connected: false,
      id: "",
      x: 0, y: 0,
      Lx: 0, Ly: 0,
      Rx: 0, Ry: 0,
      ru: false, rd: false,
      l1: false, r1: false, l2: 0, r2: 0
    };
    return;
  }

  const dz = (v) => (Math.abs(v) < DEADZONE ? 0 : v);

  // ===== Stick izquierdo (analógico) =====
  const rawX = gp.axes?.[0] ?? 0;
  const rawY = gp.axes?.[1] ?? 0;

  const x = dz(rawX);       // USV usa esto tal cual (FORWARD_THRESHOLD suele ser negativo)
  const y = dz(rawY);

  // UAV: arriba positivo => invertimos Y
  const Lx = x;
  const Ly = dz(-rawY);

  // ===== "Stick derecho" de tu joystick: llega como BOTONES =====
  // Mapeo confirmado por vos:
  const Ru = !!gp.buttons?.[0]?.pressed; // arriba
  const Rr = !!gp.buttons?.[1]?.pressed; // derecha
  const Rd = !!gp.buttons?.[2]?.pressed; // abajo
  const Rl = !!gp.buttons?.[3]?.pressed; // izquierda

  // Para USV: Ru/Rd cambian el escalón de velocidad (solo en USV)
  const ru = Ru;
  const rd = Rd;

  if (!isAereoRef.current) {
    if (ru && !prevRuRef.current) {
      speedIndexRef.current = Math.min(speedIndexRef.current + 1, SPEED_STEPS.length - 1);
      console.log("RU -> speedIndex", speedIndexRef.current, "prog", SPEED_STEPS[speedIndexRef.current]);
    }
    if (rd && !prevRdRef.current) {
      speedIndexRef.current = Math.max(speedIndexRef.current - 1, 0);
      console.log("RD -> speedIndex", speedIndexRef.current, "prog", SPEED_STEPS[speedIndexRef.current]);
    }
  }
  prevRuRef.current = ru;
  prevRdRef.current = rd;

  // UAV: stick derecho “digital” desde botones (tu esquema):
  // X lateral: Rr=+1, Rl=-1
  const uavRx = (Rr ? 1 : 0) + (Rl ? -1 : 0);
  // Y forward/back: Ru=+1 (avanza), Rd=-1 (retrocede)
  const uavRy = (Ru ? 1 : 0) + (Rd ? -1 : 0);

  // Si algún día tu joystick trae stick derecho analógico real:
  const rawRX = gp.axes?.[2] ?? 0;
  const rawRY = gp.axes?.[3] ?? 0;
  const rx = dz(rawRX);
  const ry = dz(rawRY);

  const haveRightStickAnalog = (Math.abs(rx) > 0.08) || (Math.abs(ry) > 0.08);

  // Rx/Ry finales para UAV
  const Rx = haveRightStickAnalog ? rx : uavRx;
  const Ry = haveRightStickAnalog ? dz(-rawRY) : uavRy; // arriba positivo si es analógico

  // ===== Cámara (L1/R1 zoom, L2/R2 tilt) =====
  const l1 = !!gp.buttons?.[4]?.pressed;
  const r1 = !!gp.buttons?.[5]?.pressed;
  const l2 = gp.buttons?.[6]?.value ?? (gp.buttons?.[6]?.pressed ? 1 : 0);
  const r2 = gp.buttons?.[7]?.value ?? (gp.buttons?.[7]?.pressed ? 1 : 0);

  livePadRef.current = {
    connected: true,
    id: gp.id || "",

    // USV
    x: Number(x.toFixed(3)),
    y: Number(y.toFixed(3)),

    // UAV
    Lx: Number(Lx.toFixed(3)),
    Ly: Number(Ly.toFixed(3)),
    Rx: Number(Rx.toFixed(3)),
    Ry: Number(Ry.toFixed(3)),

    // speed steps triggers (USV)
    ru,
    rd,

    // cámara
    l1,
    r1,
    l2,
    r2
  };
}, POLL_INTERVAL_MS);

//.................................................................
sendTimerRef.current = setInterval(() => {
  const live = livePadRef.current;


if (!live.connected) {
  leverActiveRef.current = false;

  setJoystickData(prev => ({
    ...prev,
    connected: false,
    updatedAt: Date.now(),
    id: "",
    enabled: false,
    // opcional: dejar sticks en 0 para que vuelvan al centro
    Lx: 0, Ly: 0, Rx: 0, Ry: 0,
    x: 0, y: 0,
    velocidad: 0,
    giro: 0,
    palancaActiva: false,
  }));

  setManualSendStatus({ type: "warn", text: "Joystick no detectado." });
  return;
}



  // Cámara (común a USV/UAV)
  const cam_zoom = (live.r1 ? 1 : 0) + (live.l1 ? -1 : 0);              // R1 zoom+ / L1 zoom-
  const cam_tilt = (live.r2 > 0.5 ? 1 : 0) + (live.l2 > 0.5 ? -1 : 0);  // R2 tilt+ / L2 tilt-

  // ======================
  // UAV (dron)
  // ======================
  if (isAereoRef.current) {
    const payload = buildJoystickPayloadAll({
      mode: "uav",
      uav_Lx: live.Lx,
      uav_Ly: live.Ly,
      uav_Rx: live.Rx, // <- en tu caso viene de botones 0/1/2/3 (digital)
      uav_Ry: live.Ry,
      cam_zoom,
      cam_tilt
    });

    // DEBUG (opcional): ver si realmente cambia cuando apretás Ru/Rd/Rl/Rr
    // console.log("UAV payload:", payload);

    socket.emit("joystick-cmd", payload);

    // para visualizar sticks en UI
    setJoystickData((prev) => ({
      ...prev,
      connected: true,
      updatedAt: Date.now(),
      id: live.id,
      Lx: live.Lx,
      Ly: live.Ly,
      Rx: live.Rx,
      Ry: live.Ry,
      enabled: true
    }));

    setManualSendStatus({
      type: "ok",
      text: `UAV | L(${Number(live.Lx).toFixed(2)},${Number(live.Ly).toFixed(2)}) R(${Number(live.Rx).toFixed(2)},${Number(live.Ry).toFixed(2)}) | Cam z:${cam_zoom} t:${cam_tilt}`
    });

    return;
  }

  // ======================
  // USV (lancha) - tu lógica original
  // ======================
  const x = live.x;
  const y = live.y;

  const velocidadProgramada = SPEED_STEPS[speedIndexRef.current];

  const palancaAdelante = y <= FORWARD_THRESHOLD;
  const palancaAtras = y >= Math.abs(FORWARD_THRESHOLD);
  const giroActivo = Math.abs(x) >= AXIS_THRESHOLD;
  const palancaCentrada = Math.abs(x) <= CENTER_RESET_THRESHOLD;

  const palancaActiva = palancaAdelante || palancaAtras || giroActivo;
  leverActiveRef.current = palancaActiva;

  let velocidadCmd = 0;

  if (palancaAdelante) {
    velocidadCmd = velocidadProgramada;
  } else if (palancaAtras) {
    velocidadCmd = -velocidadProgramada;
  } else if (giroActivo) {
    velocidadCmd = velocidadProgramada;
  }

/* reset de giro tanto en avance como en reversa */
if ((palancaAdelante || palancaAtras) && palancaCentrada) {
  rumboCmdRef.current = 0;
} else if (x <= -AXIS_THRESHOLD) {
  rumboCmdRef.current = Math.max(rumboCmdRef.current - ANGLE_STEP, -ANGLE_LIMIT);
} else if (x >= AXIS_THRESHOLD) {
  rumboCmdRef.current = Math.min(rumboCmdRef.current + ANGLE_STEP, ANGLE_LIMIT);
}

  const payload = buildJoystickPayloadAll({
    mode: "usv",
    usv_rumbo: rumboCmdRef.current,
    usv_velocidad: velocidadCmd,
    cam_zoom,
    cam_tilt
  });

  socket.emit("joystick-cmd", payload);

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
    id: live.id
  });

  setVelocidadManual(String(velocidadProgramada));
  setGiroManual(String(rumboCmdRef.current));

  setManualSendStatus({
    type: "ok",
    text: `USV | velConf ${velocidadProgramada} | vel ${velocidadCmd} | giro ${rumboCmdRef.current}° | Cam z:${cam_zoom} t:${cam_tilt}`
  });
}, SEND_INTERVAL_MS);

//....................................................

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
}, [manualMode, isAereo]);
  //...................................



useEffect(() => {
    console.log('📡 Datos actualizados:', telemetry);



console.log('Distancia seguridad :', distSeguridad);
console.log('Distancia critica :', distCritica);

  }, [telemetry]);



  const termometerRef = useRef(null);
  const compassRef = useRef(null);
  const speedRef = useRef(null);
  const batteryRef = useRef(null);
 // const rollRef = useRef(null);


  const termometerGaugeRef = useRef(null);
  const compassGaugeRef = useRef(null);
  const speedGaugeRef = useRef(null);
  const batteryGaugeRef = useRef(null);
  const rollGaugeRef = useRef(null);

  const [rotacionSuave, setRotacionSuave] = useState(rumbo);
  const rumboAnteriorRef = useRef(rumbo);

    // Montaje de gauges una sola vez – robusto ante StrictMode
useLayoutEffect(() => {
  


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


    return () => {
    //  termometerGaugeRef.current?.destroy?.();
      compassGaugeRef.current?.destroy?.();
      speedGaugeRef.current?.destroy?.();
    //  batteryGaugeRef.current?.destroy?.();
    //  rollGaugeRef.current?.destroy?.();
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

function toDMS(deg, isLat) {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = (minFloat - m) * 60;

  const hemi = isLat ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
  return `${d}° ${m}′ ${s.toFixed(2)}″ ${hemi}`;
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

setJoystickData(prev => ({
  ...prev,
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
  id: '',
  Lx: 0,
  Ly: 0,
  Rx: 0,
  Ry: 0,
}));

const neutralPayload = buildJoystickPayloadAll({
  mode: isAereo ? "uav" : "usv",

  // USV neutral
  usv_rumbo: 0,
  usv_velocidad: 0,

  // UAV neutral
  uav_Lx: 0,
  uav_Ly: 0,
  uav_Rx: 0,
  uav_Ry: 0,

  // Cámara neutral
  cam_zoom: 0,
  cam_tilt: 0,
});


socket.emit("joystick-cmd", neutralPayload, (ack) => {
  if (ack?.ok) {
    setManualSendStatus({
      type: "ok",
      text: `Control manual habilitado (${isAereo ? "UAV" : "USV"}) | neutral enviado`,
    });
  } else {
    setManualSendStatus({
      type: "warn",
      text: "Control manual habilitado, pero no se pudo enviar al backend.",
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

    setJoystickData(prev => ({
      ...prev,
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
      id: '',
      Lx: 0,
      Ly: 0,
      Rx: 0,
      Ry: 0,
    }));
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


function buildJoystickPayloadAll({
  mode, // "usv" | "uav"
  usv_rumbo = 0,
  usv_velocidad = 0,
  uav_Lx = 0,
  uav_Ly = 0,
  uav_Rx = 0,
  uav_Ry = 0,
  cam_zoom = 0, // -1/0/+1
  cam_tilt = 0  // -1/0/+1
}) {
  seqRef.current += 1;

  const toInt100 = (v) => {
    const n = Number(v) || 0;
    const scaled = Math.abs(n) <= 1.2 ? n * 100 : n; // acepta [-1..1] o [-100..100]
    return Math.max(-100, Math.min(100, Math.round(scaled)));
  };

  return {
    cmd: "joystick",
    data: {
      seq: seqRef.current,
      mode: mode === "uav" ? "uav" : "usv",
      enable: 1,
      timeout_ms: JOYSTICK_TIMEOUT_MS,

      // USV
      usv_rumbo: Math.round(usv_rumbo),
      usv_velocidad: Math.round(usv_velocidad),

      // UAV
      uav_Lx: toInt100(uav_Lx),
      uav_Ly: toInt100(uav_Ly),
      uav_Rx: toInt100(uav_Rx),
      uav_Ry: toInt100(uav_Ry),

      // Cámara (común)
      cam_zoom: Math.max(-1, Math.min(1, cam_zoom)),
      cam_tilt: Math.max(-1, Math.min(1, cam_tilt)),
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
  style={{
    gridColumn: "1",
    gridRow: "1",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}
>
<IndicadorTelemetria calidad={telemetriaLink.calidad} />
</div>

      <div
        className="gauge-container gauge-termometer"
        style={{
          gridColumn: "1",
          gridRow: "2",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <TempLevel value={temperatura} min={-20} max={90} />
      </div>


       {/* compass */}
      <div
        className="gauge-container gauge-compass"
        style={{
          gridColumn: '2 / span 2',
          gridRow: '1',
          display: isAereo ? "none" : "flex",
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <canvas ref={compassRef} />
      </div>

     {/* ---------------------------------------------- */} 


        {/* rumbo */}
      {/* RUMBO / ACTITUD - FILA 1 */}
      <div
        className="celda-4-1"
        style={{
          gridColumn: isAereo ? '3 / span 3' : '4',
          gridRow: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 0,
          minHeight: 0,
          zIndex: 5,
        }}
      >
        {!isAereo ? (
          <div className="rumbo-container">
            <p className="rumbo-label">Rumbo</p>
            <p className="rumbo-value">{rumbo.toFixed(2)}°</p>
          </div>
        ) : (
          <div className="attitude-central">
            <AttitudeIndicator rollDeg={roll} pitchDeg={pitch} size={185} />
          </div>
        )}
      </div>

        <div
          style={{
            gridColumn: '6',
            gridRow: '2'
          }}
        >
          <BotonEmergencia socket={socket} />
        </div>
      {/* CORRECCIÓN - FILA 2 */}
      <div
        className="celda-4-2"
        style={{
          gridColumn: isAereo ? '3 / span 3' : '4',
          gridRow: '2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 0,
          minHeight: 0,
          zIndex: 5,
        }}
      >
        {!isAereo ? (
          <div className="correccion-rumbo-box">
            <div className={`correccion-arrow ${necesitaIzquierda ? 'active' : ''}`}>
              ◀
            </div>

            <div className={`correccion-display ${misionActiva ? 'active' : 'inactive'}`}>
              <div className="correccion-title">
                {misionActiva ? "CORRECCIÓN" : "MISIÓN INACTIVA"}
              </div>

              <div className="correccion-value">
                {correccionRumbo.toFixed(1)}
              </div>

              <div className={`correccion-subtitle ${rumboEnVia ? 'active' : ''}`}>
                Timón Vía
              </div>

              <div className="correccion-info">
                WP {wpIndex}/{wpTotal} - {wpActual}
              </div>
            </div>

            <div className={`correccion-arrow ${necesitaDerecha ? 'active' : ''}`}>
              ▶
            </div>
          </div>
        ) : (
          <div className="correccion-uav-scale">
            <div className="correccion-uav-box">
              <div className={`uav-arrow-up ${necesitaSubir ? 'active' : ''}`}>
                ▲
              </div>

              <div className="correccion-uav-row">
                <div className={`correccion-arrow ${necesitaIzquierda ? 'active' : ''}`}>
                  ◀
                </div>

                <div className={`correccion-uav-display ${misionActiva ? 'active' : 'inactive'}`}>
                  <div className="correccion-title">
                    {misionActiva ? "CORRECCIÓN" : "MISIÓN INACTIVA"}
                  </div>

                  <div className="uav-values">
                    <div className="uav-value-block altitude">
                      <div className="uav-label">ALTURA</div>
                      <div className="uav-number">
                        {correccionAltura.toFixed(1)}
                      </div>
                      <div className="uav-unit">m</div>
                    </div>

                    <div className="uav-separator">/</div>

                    <div className="uav-value-block heading">
                      <div className="uav-label">RUMBO</div>
                      <div className="uav-number">
                        {correccionRumbo.toFixed(1)}
                      </div>
                      <div className="uav-unit">°</div>
                    </div>
                  </div>

                  <div className="uav-bottom-info">
                    <span className={alturaEnVia ? "alt-ok" : ""}>Altura vía</span>
                    <span className={rumboEnVia ? "rumbo-ok" : ""}>Rumbo vía</span>
                  </div>
                </div>

                <div className={`correccion-arrow ${necesitaDerecha ? 'active' : ''}`}>
                  ▶
                </div>
              </div>

              <div className={`uav-arrow-down ${necesitaBajar ? 'active' : ''}`}>
                ▼
              </div>
            </div>
          </div>
        )}
      </div>

      {/* speed */}
      <div
        className="gauge-container gauge-speed"
        style={{
          gridColumn: '5 / span 2',
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

          gridColumn: "1",
          gridRow: "3",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <BatteryLevel value={bateria} width={160} height={80} orientation="horizontal"/>
      </div>


{/* sector manual inferior */}

      <div
        className="modeSwitchCell"
        style={{
          gridColumn: "7",
          gridRow: "3",
          justifySelf: "center",
          alignSelf: "center",
        }}
      >
          <button
            type="button"
            className={`modeSwitchBtn ${isAereo ? "aereo" : "superficie"}`}
            onClick={() => setMode(isAereo ? "superficie" : "aereo")}
            aria-pressed={isAereo}
            title={isAereo ? "Modo dron aéreo" : "Modo superficie"}
          >
            <img className="modeSwitchImg" src={switchImg} alt="Selector modo USV/UAV" />
            <div className="modeSwitchLabels">
              <span className={!isAereo ? "active" : ""}>USV</span>
              <span className={isAereo ? "active" : ""}>UAV</span>
            </div>
          </button>
      </div>

       {isAereo ? (
        <>
          {/* instrumentos de dron aéreo */}
          {/* ejemplo: Altura, Vario, actitud, etc */}


            <div
              className="manualDock"
              style={{
                gridColumn: '3 / span 3',
                gridRow: '3 / span 2'
              }}
            >
          <div className={`manualDockCard ${manualMode ? 'active' : 'disabled'}`}>
            {manualMode && (
              <button className="manualDockAutoBtn" onClick={handleVolverATablero}>
                automático
              </button>
            )}

          <div className="manualDockVisuals">
            <LeftStickSVG
              yaw={joystickData.Lx ?? 0}
              climb={joystickData.Ly ?? 0}
              size={250}
            />

            <RightStickSVG
              lateral={joystickData.Rx ?? 0}
              forward={joystickData.Ry ?? 0}
              size={250}
            />
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


          {/* ALTURA + VARIO: fila 1, columna 6 */}
          <div style={{ gridColumn: "2 ", gridRow: "1 ", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <AltitudeVario altM={altura/100} varioMs={vario} altMax={100} varioMax={5} />
          </div>

          {/* LIDAR: fila 2, columnas 1  */}
          <div style={{ gridColumn: "2 ", gridRow: "2", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <LidarRange distCm={distancia} maxCm={300} />
          </div>

          <div
            className=" side-instruments"
            style={{
              gridColumn: "7",
              gridRow: "1 / span 3",
            }}
          >
            <div className="panel gps-container">
            <p className="panel-label">GPS</p>
            <p className="panel-value panel-value--small">{toDMS(lat, true)}</p>
            <p className="panel-value panel-value--small">{toDMS(lon, false)}</p>
            </div>

            <div className="rumbo-container side-panel">
              <p className="rumbo-label">Rumbo</p>
              <p className="rumbo-value">{rumbo.toFixed(2)}°</p>
            </div>

          <div className="panel gps-container">
          <p className="panel-label">Presión</p>
          <p className="panel-value">{presion.toFixed(1)} hPa</p>
          </div>
          </div>
        </>
      ) : (
        <>
          {/* instrumentos de superficie (tu layout actual) */}


        <div
          className={`manualDock ${isAereo ? 'manualDockUAV' : ''}`}
          style={{
            gridColumn: '3 / span 3',
            gridRow: '3 / span 2'
          }}
        >


        <div className={`manualDockCard ${manualMode ? 'active' : 'disabled'}`}>
          {manualMode && (
            <button
              type="button"
              className="manualDockAutoBtn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("CLICK AUTOMATICO");
                handleVolverATablero();
              }}
            >
              automático
            </button>
          )}

              <div className="manualDockVisuals">
                {isAereo ? (
                  <>
                <LeftStickSVG
                  yaw={joystickData.Lx ?? 0}
                  climb={joystickData.Ly ?? 0}
                  size={200}
                />

                <RightStickSVG
                  lateral={joystickData.Rx ?? 0}
                  forward={joystickData.Ry ?? 0}
                  size={200}
                />
                  </>
                ) : (
                  <>
                    <VolanteSVG angle={volanteVisualDeg} value={joystickData.giro} />
                    <PalancaSVG levelPct={palancaVisualPct} value={joystickData.velocidad} />
                  </>
                )}
              </div>

              <div className="manualDockReadout">
              <div className="manualDockInputs">
                    {isAereo ? (
                        <>
                          <div className="manualDockMetricHead">
                            <span>Lx (Yaw)</span>
                            <span className="manualDockMetricNum">{(joystickData.Lx ?? 0).toFixed(2)}</span>      </div>
                          <div className="manualDockMetricHead">
                            <span>Ly (Sube/Baja)</span>
                            <span className="manualDockMetricNum">{(joystickData.Ly ?? 0).toFixed(2)}</span>      </div>
                          <div className="manualDockMetricHead">
                            <span>Rx (Lateral)</span>
                            <span className="manualDockMetricNum">{(joystickData.Rx ?? 0).toFixed(2)}</span>      </div>
                          <div className="manualDockMetricHead">
                            <span>Ry (Avanza/Retro)</span>
                            <span className="manualDockMetricNum">{(joystickData.Ry ?? 0).toFixed(2)}</span>      </div>
                        </>
                      ) : (
                        <>
                                  <div className="manualDockMetric">
                                    <div className="manualDockMetricHead">
                                      <span>Velocidad</span>
                                      <span className="manualDockMetricNum">{velocidadManual}</span>
                                    </div>
                                    <div className="manualDockBar">
                                      <div
                                        className="manualDockBarFill"
                                        style={{width: `${Math.min(100, Math.max(0, Number(velocidadManual)))}%` }}
                                      />
                                    </div>
                                  </div>

                                  <div className="manualDockMetric">
                                    <div className="manualDockMetricHead">
                                      <span>Giro</span>
                                      <span className="manualDockMetricNum">{giroManual}</span>
                                    </div>

                                    <div className="manualDockBarCenter">
                                      <div className="manualDockBarZero" />

                                      {/* fill a izquierda (negativo) */}
                                      <div
                                        className="manualDockBarFillLeft"
                                        style={{
                                          width: `${(Math.min(90, Math.abs(Math.min(0, Number(giroManual) || 0))) / 90) * 50}%`
                                        }}
                                      />

                                      {/* fill a derecha (positivo) */}
                                      <div
                                        className="manualDockBarFillRight"
                                        style={{
                                          width: `${(Math.min(90, Math.max(0, Number(giroManual) || 0)) / 90) * 50}%`
                                        }}
                                      />
                                    </div>

                                    <div className="manualDockMetricFoot">
                                      <span>-90</span>
                                      <span>0</span>
                                      <span>+90</span>
                                    </div>
                                  </div>
                        </>
                      )}
            </div>

            <div
              className={`manualDockStatus ${joystickData.connected ? 'ok' : 'warn'}`}
              role="status"
              aria-live="polite"
            >
              {joystickData.connected
                ? `Joystick conectado `
                : 'Joystick desconectado'}
            </div>

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


          <div style={{ gridColumn: "2 / span 2", gridRow: "2", display:"flex", justifyContent:"center", alignItems:"center" }}>
            <RollInclinometer rollDeg={roll} />
          </div>

          <div
            className=" side-instruments"
            style={{
              gridColumn: "7",
              gridRow: "1 / span 3",   
            }}
          >
            <div className="panel gps-container">
              <p className="panel-label">GPS</p>
              <p className="panel-value panel-value--small">{toDMS(lat, true)}</p>
              <p className="panel-value panel-value--small">{toDMS(lon, false)}</p>
            </div>

            <div className={`panel gps-container obstacle-panel ${estadoDistancia}`}>
              <p className="panel-label">
                {estadoDistancia === 'critica'
                  ? '🚨 CRÍTICO'
                  : estadoDistancia === 'alerta'
                  ? '⚠️ SEGURIDAD'
                  : '✅ LIBRE'}
              </p>

              <p className="panel-value">
                Dist: {distancia.toFixed(0)} cm
              </p>

              <p className="text-xs mt-1">
                Min: {distCritica} cm | Max: {distSeguridad} cm
              </p>
            </div>

            <div className="panel gps-container">
              <p className="panel-label">Presión</p>
              <p className="panel-value">{presion.toFixed(1)} hPa</p>
            </div>
          </div>
                  </>
                )}


    </div>
  </div>
);
};

export default NavigationTablero;


