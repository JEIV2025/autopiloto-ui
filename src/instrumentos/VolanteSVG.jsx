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

export default VolanteSVG;