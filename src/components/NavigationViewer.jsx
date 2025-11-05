import React, { useState, useEffect, useRef } from "react";
import "../style/NavigationViewer.css";
import { useTelemetry } from './TelemetryContext';




const MAX_DESPLAZAMIENTO = 600; // máximo desplazamiento lateral del barco
const FACTOR_MOVIMIENTO = 4; // sensibilidad del desplazamiento (mientas mayor es mas sensible)

export default function NavigationViewer() {



  const { telemetry } = useTelemetry();

  //const rumbo = telemetry?.rumbo ?? 0;
  const pitch = telemetry?.pitch ?? 0;
  const roll = telemetry?.roll ?? 0;


  const [desplazamiento, setDesplazamiento] = useState(0);
  const [desplazamientoY, setDesplazamientoY] = useState(0);
  const [rotacionZ, setRotacionZ] = useState(0);

  const [modoManual, setModoManual] = useState(false);
const [rumboManual, setRumboManual] = useState(0);


  const [rumboCentrado, setRumboCentrado] = useState(null); // rumbo de referencia
  const [movimientoHabilitado, setMovimientoHabilitado] = useState(false); // activa desplazamiento


const rumbo = modoManual ? rumboManual : telemetry?.rumbo ?? 0;



  const prevRumbo = useRef(rumbo);
  const videoRef = useRef(null);



  // Actualizar desplazamiento en base al cambio de rumbo
useEffect(() => {

   if (!movimientoHabilitado || rumboCentrado === null) return;
  const delta = ((rumbo - prevRumbo.current + 540) % 360) - 180;  // Rango de -180 a +180
  
  
  const UMBRAL_SALTO = 30; // grados máximos permitidos por muestra
  if (Math.abs(delta) > UMBRAL_SALTO) {
    console.warn(`⚠️ Ignorado salto abrupto de rumbo: Δ${delta.toFixed(2)}°`);
    return; // Ignora esta actualización de rumbo
  }
 
  const nuevoDesplazamiento = desplazamiento + delta * FACTOR_MOVIMIENTO;
  const limitado = Math.max(-MAX_DESPLAZAMIENTO, Math.min(MAX_DESPLAZAMIENTO, nuevoDesplazamiento));

  setDesplazamiento(limitado);
  prevRumbo.current = rumbo;
}, [rumbo]);



useEffect(() => {
  if (videoRef.current) {
    const desplazamient = Math.max(-30, Math.min(30, pitch * 2)); // Limita entre -30 y +30px
    setDesplazamientoY(desplazamient);

    const inclinacion = Math.max(-15, Math.min(15, roll * 0.5)); // Limita rotación a ±15 grados
    setRotacionZ(inclinacion);

  //  videoRef.current.style.transform = `translateY(${desplazamient}px) rotateZ(${inclinacion}deg) scale(1.2)`;
  //  videoRef.current.style.transition = 'transform 0.5s ease';
  }
}, [pitch, roll]);

useEffect(() => {
  if (!modoManual) {
    setRumboManual(telemetry?.rumbo ?? 0);
  }
}, [modoManual, telemetry?.rumbo]);




  return (
    <div className="navigation-wrapper" >
      {/* Video de fondo */}
        <video
          ref={videoRef}
          className="video-bg"
          src="/oceanVideo.mp4"
          autoPlay
          loop
          muted
          
          style={{
            transform: `translateY(${desplazamientoY}px) rotateZ(${rotacionZ}deg) scale(1.2)`,
            transition: 'transform 0.8s ease-in-out',
          }}
        />

      
      <img
        src="/boya.png"
        alt="Boya"
        className="boat-overlay"
        style={{
          transform: `translate(-50%, 50%) translateX(${desplazamiento}px)`,
          transition: 'transform 0.5s ease',
        }}
      />
      <img
        src="/boya.png"
        alt="Boya2"
        className="boat-overlay2"
        style={{
          transform: `translate(-50%, 50%) translateX(${desplazamiento}px)`,
          transition: 'transform 0.5s ease',
        }}
      />

      <img
        src="/boya.png"
        alt="Boya3"
        className="boat-overlay3"
        style={{
          transform: `translate(-50%, 50%) translateX(${desplazamiento}px)`,
          transition: 'transform 0.5s ease',
        }}
      />
      <img
        src="/boya.png"
        alt="Boya4"
        className="boat-overlay4"
        style={{
          transform: `translate(-50%, 50%) translateX(${desplazamiento}px)`,
          transition: 'transform 0.5s ease',
        }}
      />

      <img
      src="/proa2.png"
      alt="Proa"
      className="proa-overlay"
      style={{
        position: 'absolute',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '550px', // ⬅️ Ajustá este valor según necesidad
        height: ' 150px',
        transition: 'width 0.3s ease-in-out',
        pointerEvents: 'none', // evita interferencias con clics
        zIndex: 20
      }}
    />




      {/* Overlay brújula */}
      <div className="compass-overlay">
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Círculo exterior */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="white"
            strokeWidth="3"
            fill="rgba(0,0,0,0.4)"
          />
          {/* Aguja */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke="red"
            strokeWidth="3"
            strokeLinecap="round"
        //    transform={`rotate(${rumbo} 50 50)`}
          />
          {/* Centro */}
          <circle cx="50" cy="50" r="5" fill="white" />

        
          <g transform={`rotate(${-rumbo} 50 50)`}>
            <text x="50" y="18" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">N</text>
            <text x="87" y="54" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">E</text>
            <text x="50" y="90" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">S</text>
            <text x="15" y="54" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">O</text>
          </g>

        </svg>
      </div>

<div className={`modeBox absolute top-2 left-2 bg-white bg-opacity-80 p-2 rounded shadow text-sm ${modoManual ? 'expanded' : 'collapsed'}`}>
  <label className="block mb-1 font-bold text-xs">Modo Manual:</label>
  <label className="flex items-center gap-2 mb-2">
    <input
      type="checkbox"
      checked={modoManual}
      onChange={() => setModoManual(!modoManual)}
    />
    <span className="text-xs">Activar </span>
  </label>

  {modoManual && (
    <div className="modeBox-content">
      <label className="block font-bold text-xs">
        Rumbo: {rumboManual}°
      </label>
      <input
        type="range"
        min="-180"
        max="180"
        value={rumboManual}
        onChange={(e) => setRumboManual(Number(e.target.value))}
        className= "rangeBar w-full h-2 mb-2"
      />
    </div>
  )}

  {/* NUEVO: Control de movimiento visual */}
  <div className="mt-2 border-t pt-2">
    <label className="block text-xs font-bold mb-1">Movimiento Visual:</label>
    
    <button
      onClick={() => {
        setRumboCentrado(rumbo); // define rumbo actual como referencia
        setMovimientoHabilitado(true);
        prevRumbo.current = rumbo; // asegura continuidad
      }}
      disabled={movimientoHabilitado}
      className={ `botonCentrado w-full px-2 py-1 text-xs rounded ${
        movimientoHabilitado
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {movimientoHabilitado ? "Centrado" : " Centrar"}
    </button>
  </div>
</div>





    </div>
  );
}
