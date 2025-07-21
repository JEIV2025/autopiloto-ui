import React, { useState } from 'react';
import bgImg from '../images/flotanaval.jpg'; // Asegurate de tener esta imagen

const NavigationViewer = ({ posX = 0, posY = 0 }) => {
  const zoom = 5; // Ampliación de la imagen
  const scale = `scale(${zoom})`;

  return (
   <div className="relative w-full h-full overflow-hidden rounded-xl bg-black">
      {/* Imagen ampliada y centrada */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) ${scale}`,
          transformOrigin: 'center center',
        }}
      >
        <img
          src={bgImg}
          alt="Simulación navegación"
          className="block"
        />
      </div>


    </div>
  );
};

export default NavigationViewer;
