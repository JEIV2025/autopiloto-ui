import React from 'react';
import { RadialGauge } from 'react-canvas-gauges';

const SpeedGauge = ({ value }) => {
  return (
    <RadialGauge
      width={200}
      height={200}
      units="knots/h"
      title="Velocidad"
      minValue={0}
      maxValue={20}
      majorTicks={[0,2,4,6,8,10,12,14,16,18,20]}
      value={value}
    />
  );
};

export default SpeedGauge;
