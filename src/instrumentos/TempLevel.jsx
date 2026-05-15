export function TempLevel({
  value = 0,
  min = -20,
  max = 90,
  label = "Temperatura",
}) {
  const vRaw = Number(value);
  const v = Number.isFinite(vRaw) ? vRaw : 0;

  const clamped = Math.max(min, Math.min(max, v));
  const pct = ((clamped - min) / (max - min)) * 100;

  // segmentos y colores (ajustables)
  const segments = [
    { color: "#43a047" }, // verde
    { color: "#8bc34a" }, // verde-amarillo
    { color: "#fdd835" }, // amarillo
    { color: "#fb8c00" }, // naranja
    { color: "#e53935" }, // rojo
  ];

  return (
    <div style={{ display: "grid", placeItems: "center", gap: 8, width: "100%" }}>
      <div style={{ color: "#fff", fontWeight: 700 }}>{label}</div>

      <div style={{ position: "relative", width: "100%", maxWidth: 280 }}>
        {/* barra */}
        <div
          style={{
            height: 18,
            borderRadius: 999,
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: `repeat(${segments.length}, 1fr)`,
            border: "2px solid #111",
            background: "#fff",
          }}
        >
          {segments.map((s, i) => (
            <div key={i} style={{ background: s.color }} />
          ))}
        </div>

        {/* marcador (triángulo) */}
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 8px)`,
            top: 22,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "12px solid #111",
          }}
        />
      </div>

      <div style={{ color: "yellow", fontSize: 22, fontWeight: 800 }}>
        {clamped.toFixed(1)}°C
      </div>
    </div>
  );
}