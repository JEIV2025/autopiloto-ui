export function RollInclinometer({ rollDeg = 0, maxDeg = 45, label = "Rolido" }) {
  const r = Math.max(-maxDeg, Math.min(maxDeg, Number(rollDeg) || 0));

  return (
    <div className="rollPanel">
      <div className="rollPanelTitle">{label}</div>

      <div className="rollGauge">
        <div className="rollArc" />

        <div className="rollTicks">
          {[-30, -20, -10, 0, 10, 20, 30].map((t) => (
            <div
              key={t}
              className={`rollTick ${t === 0 ? "zero" : ""}`}
              style={{ transform: `translateX(-50%) rotate(${t}deg)` }}
              title={`${t}°`}
            />
          ))}
        </div>

        <div
          className="rollNeedleWrap"
          style={{ transform: `translateX(-50%) rotate(${r}deg)` }}
        >
          <div className="rollNeedle" />
          <div className="rollNeedleTip" />
        </div>

        <div className="rollReadout">
          <span className="rollSide">Babor</span>
          <span className="rollValue">{r.toFixed(1)}°</span>
          <span className="rollSide">Estribor</span>
        </div>
      </div>
    </div>
  );
}