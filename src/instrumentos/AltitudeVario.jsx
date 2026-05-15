// AltitudeVario.jsx
import React from "react";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function AltitudeVario({
  altM = 0,
  varioMs = 0,
  altMax = 50,      // ajustá a tu rango típico
  varioMax = 5,     // +/- m/s
  label = "Altura",
}) {
  const alt = Number.isFinite(altM) ? altM : 0;
  const vz = Number.isFinite(varioMs) ? varioMs : 0;

  const altPct = clamp((alt / altMax) * 100, 0, 100);

  // vario -> % de la mitad de la barra
  const half = 50;
  const vzClamped = clamp(vz, -varioMax, varioMax);
  const vzPct = (Math.abs(vzClamped) / varioMax) * half;

  return (
    <div className="uavPanel">
      <div className="uavPanelTitle">{label}</div>

      <div className="altGrid">
        <div className="altBig">{alt.toFixed(1)} m</div>

        <div className="altTape">
          <div className="altFill" style={{ height: `${altPct}%` }} />
        </div>

        <div className="varioBox">
          <div className="varioLabel">Vario</div>
          <div className="varioValue">{vz.toFixed(2)} m/s</div>

          <div className="varioBar">
            <div className="varioZero" />
            {vzClamped >= 0 ? (
              <div className="varioUp" style={{ height: `${vzPct}%` }} />
            ) : (
              <div className="varioDown" style={{ height: `${vzPct}%` }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}