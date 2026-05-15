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

export default PalancaSVG;
