import React from "react";

const IndicadorTelemetria = ({ calidad = 0 }) => {
  const c = Math.max(0, Math.min(100, Number(calidad) || 0));

  const color =
    c > 80 ? "#00ff66" :
    c > 50 ? "#ffaa00" :
             "#ff3333";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "230px",
        background: "#000",
        borderRadius: "12px",
        padding: "10px",
        border: "2px solid #333",
        textAlign: "center",
        boxShadow: c < 30 ? "0 0 15px red" : "none",
        animation: c < 30 ? "telemetriaAlarm 1s infinite" : "none",
      }}
    >
      <p style={{ color: "yellow", fontWeight: "bold", marginBottom: "6px", fontSize: "18px" }}>
        📡 Telemetría
      </p>

      <p style={{ color, fontSize: "24px", fontWeight: "bold", marginBottom: "6px" }}>
        {c.toFixed(1)} %
      </p>

      <div style={{ width: "100%", height: "12px", background: "#222", borderRadius: "8px", overflow: "hidden", border: "1px solid #555" }}>
        <div
          style={{
            width: `${c}%`,
            height: "100%",
            transition: "width 0.5s ease",
            background: color,
          }}
        />
      </div>
    </div>
  );
};

export default IndicadorTelemetria;