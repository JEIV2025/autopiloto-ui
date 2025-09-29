import React from 'react';
import '../style/SideBar.css';

const SideBar = ({
  mostrarAside,
  seccionActiva,
  setSeccionActiva,
  setSeccionAnterior,
  setShowPlanManager,
}) => (
  <aside className="sidebar">
    {/* Logo y título */}
    <div className="sidebar-logo">
      <div className="sidebar-logo-img">
        <img src="./images/LogoDIIV.png" alt="Logo1" className="h-18" />
      </div>
      <h1 className="sidebar-title">Autopiloto  -  USV</h1>
    </div>

    {/* Menú */}
    <nav className="sidebar-nav">
      <button onClick={() => setSeccionActiva("inicio")}
        className={`sidebar-btn ${seccionActiva === "inicio" ? "active" : ""}`}>Inicio</button>
      <button onClick={() => setSeccionActiva("navegacion")}
        className={`sidebar-btn ${seccionActiva === "navegacion" ? "active" : ""}`}>Navegación</button>
      <button onClick={() => setSeccionActiva("panel")}
        className={`sidebar-btn ${seccionActiva === "panel" ? "active" : ""}`}>Panel de Control</button>
      <button onClick={() => setSeccionActiva("mision")}
        className={`sidebar-btn ${seccionActiva === "mision" ? "active" : ""}`}>Misión Actual</button>
      <button onClick={() => {
        setSeccionAnterior(seccionActiva);
        setShowPlanManager(true);
        setSeccionActiva('guardar');
      }}
        className={`sidebar-btn ${seccionActiva === "guardar" ? "active" : ""}`}>Guardar / Cargar</button>
      <button onClick={() => setSeccionActiva("consola")}
        className={`sidebar-btn ${seccionActiva === "consola" ? "active" : ""}`}>Consola</button>
    </nav>

    <div className="sidebar-desc">
      <p>
        Éste es un proyecto de la JEIV - Armada Argentina orientado al desarrollo de un sistema completo de control, navegación y telemetría 
        para embarcaciones no tripuladas. Basado en sensores inerciales, GPS y comunicación remota. Con el objetivo de poder planificar una misión y 
        que el vehículo tenga la capacidad cumplirla de manera autónoma, cargándole la misión de manera encriptada o en claro. 
      </p>
      <div className="sidebar-logo-img">
        <img src="./images/Armada.png" alt="Logo2" className="h-18" />
      </div>
    </div>
  </aside>
);

export default SideBar;