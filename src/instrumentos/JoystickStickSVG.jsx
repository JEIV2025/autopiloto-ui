import React, { useId } from "react";

import '../style/JoystickStickSVG.css';

// Normaliza entrada: acepta [-1..1] o [-100..100]
function norm(v) {
  const n = Number(v) || 0;
  if (Math.abs(n) <= 1.2) return Math.max(-1, Math.min(1, n));
  return Math.max(-1, Math.min(1, n / 100));
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function StickBase({
  title = "Joystick",
  x = 0,          // -1..1
  y = 0,          // -1..1
  xLabelNeg = "",
  xLabelPos = "",
  yLabelPos = "",
  yLabelNeg = "",
  valueText = "",
}) {
  const uid = useId();
  const plate = `plate-${uid}`;
  const gate = `gate-${uid}`;
  const knob = `knob-${uid}`;
  const shadow = `shadow-${uid}`;

  const xn = norm(x);
  const yn = norm(y);

  // Ojo: en SVG, +Y es hacia abajo, por eso invertimos
  const xClamped = clamp(xn, -1, 1);
  const yClamped = clamp(yn, -1, 1);

  // centro del “gate”
  const cx = 140;
  const cy = 140;

  // radio de movimiento del knob
  const R = 70;

  const kx = cx + xClamped * R;
  const ky = cy + (-yClamped) * R;

  return (
    <div className="manualSvgGroup">
      <div className="manualSvgTitle">{title}</div>

      <svg
        className="manualSvgCanvas manualSvgStick"
        viewBox="0 0 280 280"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={plate} cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#2a313a" />
            <stop offset="55%" stopColor="#131a22" />
            <stop offset="100%" stopColor="#0a0f14" />
          </radialGradient>

          <radialGradient id={gate} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
          </radialGradient>

          <radialGradient id={knob} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f2f2f2" />
            <stop offset="55%" stopColor="#c9c9c9" />
            <stop offset="100%" stopColor="#6b6b6b" />
          </radialGradient>

          <filter id={shadow} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Panel base */}
        <rect x="18" y="18" width="244" height="244" rx="22" fill={`url(#${plate})`} />
        <rect x="18" y="18" width="244" height="244" rx="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />

        {/* Gate circular */}
        <circle cx={cx} cy={cy} r="98" fill={`url(#${gate})`} stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="72" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" strokeDasharray="6 8" />

        {/* cruz central */}
        <line x1={cx - 80} y1={cy} x2={cx + 80} y2={cy} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        <line x1={cx} y1={cy - 80} x2={cx} y2={cy + 80} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="6" fill="rgba(255,255,255,0.25)" />

        {/* vector (línea desde centro al knob) */}
        <line x1={cx} y1={cy} x2={kx} y2={ky} stroke="rgba(255,230,107,0.75)" strokeWidth="3" />

        {/* knob */}
        <g filter={`url(#${shadow})`}>
          <circle cx={kx} cy={ky} r="24" fill={`url(#${knob})`} />
          <circle cx={kx} cy={ky} r="24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
          <circle cx={kx} cy={ky} r="9" fill="rgba(0,0,0,0.18)" />
        </g>

        {/* etiquetas */}
        <text x={140} y={46} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="14" fontWeight="800">
          {yLabelPos}
        </text>
        <text x={140} y={262} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="14" fontWeight="800">
          {yLabelNeg}
        </text>
        <text x={28} y={146} textAnchor="start" fill="rgba(255,255,255,0.85)" fontSize="14" fontWeight="800">
          {xLabelNeg}
        </text>
        <text x={252} y={146} textAnchor="end" fill="rgba(255,255,255,0.85)" fontSize="14" fontWeight="800">
          {xLabelPos}
        </text>
      </svg>

      <div className="manualSvgValue">
        {valueText}
      </div>
    </div>
  );
}

// Export: UAV Left = Throttle/Yaw, Right = Pitch/Roll
export function LeftStickSVG({ yaw = 0, climb = 0 }) {
  return (
    <StickBase
      title=""
      x={yaw}
      y={climb}
      xLabelNeg="rot -"
      xLabelPos="rot +"
      yLabelPos="sube"
      yLabelNeg="baja"
      valueText={`Yaw: ${Number(yaw).toFixed?.(2) ?? yaw} | Climb: ${Number(climb).toFixed?.(2) ?? climb}`}
    />
  );
}

export function RightStickSVG({ lateral = 0, forward = 0 }) {
  return (
    <StickBase
      title=""
      x={lateral}
      y={forward}
      xLabelNeg="lat -"
      xLabelPos="lat +"
      yLabelPos="avanza"
      yLabelNeg="retrocede"
      valueText={`Lat: ${Number(lateral).toFixed?.(2) ?? lateral} | Fwd: ${Number(forward).toFixed?.(2) ?? forward}`}
    />
  );
}