import React, { useState, useEffect } from "react";
import "../style/NavigationViewer.css";

export default function NavigationViewer() {
  const [heading, setHeading] = useState(0); // rumbo en grados (0 = Norte)

  // Simulación: cambia el rumbo automáticamente cada 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      setHeading((prev) => (prev + 1) % 360); // gira 1 grado por paso
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="navigation-wrapper">
      {/* Video de fondo */}
       <video
        src="/oceanVideo.mp4"
        autoPlay
        loop
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

       {/* 🚤 Barco PNG en el centro */}
      <img src="/barquito (3).png" alt="Barco" className="boat-overlay" />

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
            transform={`rotate(${heading} 50 50)`}
          />
          {/* Centro */}
          <circle cx="50" cy="50" r="5" fill="white" />

          {/* Letras cardinales */}
          <text x="50" y="18" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">N</text>
          <text x="87" y="54" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">E</text>
          <text x="50" y="90" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">S</text>
          <text x="15" y="54" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">O</text>

        </svg>
      </div>
    </div>
  );
}
