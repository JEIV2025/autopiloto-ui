import React, { useState, useRef } from "react";
import "../style/NavigationViewer.css";

export default function NavigationViewer() {
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const blockWidth = 2000; // ancho de la panorámica (ajustar al real)
  const totalWidth = blockWidth * 2;

  const normalizeX = (val) =>
    ((val % totalWidth) + totalWidth) % totalWidth - totalWidth;

  const handleMouseDown = (e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    dragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPosX((prev) => normalizeX(prev + dx));
    setPosY((prev) => prev + dy); // scroll vertical manual
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <div className="navigation-wrapper" onMouseDown={handleMouseDown}>
      <div
        className="navigation-scene"
        style={{ transform: `translate(${posX}px, ${posY}px)` }}
      >
        {/* 3 bloques (AB-BA-AB) */}
        <div
          className="layer normal"
          style={{ backgroundImage: 'url("/panoramica.jpg")' }}
        />
        <div
          className="layer mirrored"
          style={{ backgroundImage: 'url("/panoramica.jpg")' }}
        />
        <div
          className="layer normal"
          style={{ backgroundImage: 'url("/panoramica.jpg")' }}
        />
        <div
          className="layer mirrored"
          style={{ backgroundImage: 'url("/panoramica.jpg")' }}
        />
        <div
          className="layer normal"
          style={{ backgroundImage: 'url("/panoramica.jpg")' }}
        />
        <div
          className="layer mirrored"
          style={{ backgroundImage: 'url("/panoramica.jpg")' }}
        />
      </div>
    </div>
  );
}
