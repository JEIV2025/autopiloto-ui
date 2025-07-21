import React from "react";
import "./Modulo.css";

const Modulo = ({ index, isFullscreen, onToggle, children }) => {
  return (
    <div className={`modulo ${isFullscreen ? "fullscreen" : ""}`}>
      <button className="fullscreen-button" onClick={onToggle}>
        {isFullscreen ? "⤶" : "🗖"}
      </button>
      <div className="contenido">
        {children || <h2>Módulo {index + 1}</h2>}
      </div>
    </div>
  );
};

export default Modulo;
