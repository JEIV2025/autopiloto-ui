// LidarRange.jsx
import React from "react";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function LidarRange({
  distCm = 0,
  maxCm = 300,      // hasta dónde escala la barra
  label = "LIDAR / AGL",
}) {
  const d = Number.isFinite(distCm) ? distCm : 0;
  const pct = clamp((d / maxCm) * 100, 0, 100);

  const color =
    d < 50 ? "#e53935" :
    d < 100 ? "#fb8c00" :
    d < 200 ? "#fdd835" :
              "#43a047";

  return (
    <div className="uavPanel">
      <div className="uavPanelTitle">{label}</div>

      <div className="lidarValue">{d.toFixed(0)} cm</div>

      <div className="lidarBar">
        <div className="lidarFill" style={{ width: `${pct}%`, background: color }} />
      </div>

      <div className="lidarTicks">
        <span>0</span>
        <span>{maxCm / 2}</span>
        <span>{maxCm}</span>
      </div>
    </div>
  );
}