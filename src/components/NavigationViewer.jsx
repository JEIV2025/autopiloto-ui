import React, { useEffect, useRef, useState } from "react";
import WAVES from "vanta/dist/vanta.waves.min";
import * as THREE from "three";

export default function NavigationViewer() {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        WAVES({
          el: vantaRef.current,
          THREE: THREE, // obligatorio
          color: 0x1e90ff,   // azul mar
          shininess: 50,
          waveHeight: 20,
          waveSpeed: 0.7,
          zoom: 1,
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <div
      ref={vantaRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
}
