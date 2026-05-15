export function BatteryLevel({
  value = 0,
  label = "",
  width = 90,
  height = 170,
  orientation = "vertical", // "vertical" | "horizontal"
}) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));

  const segments = 5;

  // si querés niveles por escalones exactos: 0/25/50/75/100
  const filled =
    v <= 0 ? 0 :
    v <= 25 ? 1 :
    v <= 50 ? 2 :
    v <= 75 ? 3 : 5;

  const color =
    v <= 0  ? "#b0b0b0" :
    v <= 25 ? "#e53935" :
    v <= 50 ? "#fb8c00" :
    v <= 75 ? "#fdd835" :
              "#43a047";

  const isH = orientation === "horizontal";

  // dimensiones por defecto si está horizontal y no querés pasar props
  const W = width ?? (isH ? 190 : 90);
  const H = height ?? (isH ? 90 : 170);

  return (
    <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
      <div style={{ color: "#fff", fontWeight: 700 }}>{label}</div>

      <div
        style={{
          width: W,
          height: H,
          border: "4px solid #111",
          borderRadius: 12,
          background: "#f5f5f5",
          position: "relative",
          padding: 10,
          boxSizing: "border-box",
        }}
      >
        {/* “pitorro” */}
        <div
          style={{
            position: "absolute",
            ...(isH
              ? {
                  right: -14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 12,
                  height: 34,
                  border: "4px solid #111",
                  borderLeft: "none",
                  borderRadius: "0 10px 10px 0",
                }
              : {
                  top: -14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 34,
                  height: 12,
                  border: "4px solid #111",
                  borderBottom: "none",
                  borderRadius: "10px 10px 0 0",
                }),
            background: "#f5f5f5",
            boxSizing: "border-box",
          }}
        />

        {/* segmentos */}
        <div
          style={{
            display: "flex",
            flexDirection: isH ? "row" : "column",
            gap: 8,
            height: "100%",
            width: "100%",
          }}
        >
          {Array.from({ length: segments }).map((_, i) => {
            // llenar desde abajo (vertical) o desde la izquierda (horizontal)
            const idx = isH ? i : (segments - 1 - i);
            const on = idx < filled;

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRadius: 6,
                  border: "2px solid #111",
                  background: on ? color : "#ffffff",
                  opacity: on ? 1 : 0.25,
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ color: "yellow", fontSize: 22, fontWeight: 800 }}>
        {v.toFixed(0)}%
      </div>
    </div>
  );
}