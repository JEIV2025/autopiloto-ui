// AttitudeIndicator.jsx
import React from "react";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function AttitudeIndicator({
  rollDeg = 0,
  pitchDeg = 0,
  size = 240,
  label = "Actitud",
}) {
  // limitamos pitch para que no se vaya de pantalla
  const pitchClamped = clamp(pitchDeg, -45, 45);

  // mapeo pitch grados -> pixeles
  // (ajustá 2.2 si querés más/menos sensibilidad)
  const pitchPx = (pitchClamped) * (size / 110) * 2.2;

  return (
    <div className="uavPanel">
      <div className="uavPanelTitle">{label}</div>

      <div className="attitudeWrap" style={{ width: size, height: size }}>
        {/* esfera */}
        <div
          className="attitudeHorizon"
          style={{
            transform: `translateY(${pitchPx}px) rotate(${rollDeg}deg)`,
          }}
        >
          <div className="attitudeSky" />
          <div className="attitudeGround" />
          <div className="attitudeLine" />
          {/* pequeñas marcas de pitch */}
          <div className="attitudePitchMarks">
            {[-30, -20, -10, 10, 20, 30].map((p) => (
              <div
                key={p}
                className="attitudePitchMark"
                style={{ top: `calc(50% + ${(-p) * 3}px)` }}
              />
            ))}
          </div>
        </div>

        {/* overlay fijo */}
        <div className="attitudeOverlay">
          <div className="attitudeReticle" />
          <div className="attitudeReadout">
            <div>Roll: {rollDeg.toFixed(1)}°</div>
            <div>Pitch: {pitchDeg.toFixed(1)}°</div>
          </div>
        </div>
      </div>
    </div>
  );
}